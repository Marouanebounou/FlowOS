package com.example.flowos.Services;

import com.example.flowos.Dto.InviteUserRequest;
import com.example.flowos.Dto.AcceptInvitationRequest;
import com.example.flowos.Dto.AuthResponse;
import com.example.flowos.Models.Organisation;
import com.example.flowos.Models.OrganisationInvitation;
import com.example.flowos.Models.OrganisationMember;
import com.example.flowos.Models.Role;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.OrganisationInvitationRepository;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.OrganisationRepository;
import com.example.flowos.Repositories.RoleRepository;
import com.example.flowos.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrganisationInvitationService {
    private static final String MEMBER_ROLE = "MEMBER";
    private static final long INVITATION_VALID_HOURS = 48;

    private final OrganisationRepository organisationRepository;
    private final OrganisationInvitationRepository invitationRepository;
    private final OrganisationMemberRepository organisationMemberRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public void invite(
        String inviterEmail,
        Long organisationId,
        InviteUserRequest request,
        String ipAddress
    ) {
        Organisation organisation = findOrganisation(organisationId);
        String email = normalizeEmail(request.email());

        if (organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrue(organisationId, email)) {
            throw new IllegalArgumentException("User is already a member of this organisation");
        }
        invitationRepository.findByOrganisationIdAndEmailAndUsedFalse(organisationId, email)
            .ifPresent(existingInvitation -> {
                if (existingInvitation.getExpiresAt().isAfter(LocalDateTime.now())) {
                    throw new IllegalArgumentException("An active invitation already exists for this email");
                }
                existingInvitation.setUsed(true);
                invitationRepository.save(existingInvitation);
            });

        Role role = findRole(organisationId, request.roleId());
        String rawToken = UUID.randomUUID().toString();

        OrganisationInvitation invitation = new OrganisationInvitation();
        invitation.setEmail(email);
        invitation.setTokenHash(hashToken(rawToken));
        invitation.setExpiresAt(LocalDateTime.now().plusHours(INVITATION_VALID_HOURS));
        invitation.setOrganisation(organisation);
        invitation.setRole(role);
        invitationRepository.save(invitation);

        auditLogService.logForOrganisation(
            "USER_INVITED",
            "USER",
            null,
            "email=" + email,
            inviterEmail,
            organisationId,
            ipAddress
        );
        emailService.sendOrganisationInvitation(email, organisation.getName(), rawToken);
    }

    @Transactional
    public AuthResponse accept(String token, AcceptInvitationRequest request, String ipAddress) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Invitation token is required");
        }

        OrganisationInvitation invitation = invitationRepository.findByTokenHash(hashToken(token))
            .orElseThrow(() -> new IllegalArgumentException("Invitation token is invalid or expired"));

        if (Boolean.TRUE.equals(invitation.getUsed())
            || invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invitation token is invalid or expired");
        }

        User user = userRepository.findByEmail(invitation.getEmail()).orElse(null);
        boolean newUser = user == null;

        if (newUser) {
            validateNewAccount(request);
            user = new User();
            user.setFirstName(request.firstName().trim());
            user.setLastName(request.lastName().trim());
            user.setEmail(invitation.getEmail());
            user.setPhoneNumber(normalize(request.phoneNumber()));
            user.setPassword(passwordEncoder.encode(request.password()));
            user.setActive(true);
            user = userRepository.save(user);
            auditLogService.log("USER_REGISTERED_FROM_INVITATION", "USER", user.getId(), null, user.getEmail(), ipAddress);
        } else if (!Boolean.TRUE.equals(user.getActive())) {
            validateActivation(request);
            user.setPassword(passwordEncoder.encode(request.password()));
            user.setActive(true);
            userRepository.save(user);
            auditLogService.log("USER_ACTIVATED", "USER", user.getId(), null, user.getEmail(), ipAddress);
        }

        OrganisationMember member = organisationMemberRepository
            .findByOrganisationIdAndUserId(invitation.getOrganisation().getId(), user.getId())
            .orElseGet(OrganisationMember::new);
        if (member.getId() != null && Boolean.TRUE.equals(member.getActive())) {
            throw new IllegalArgumentException("User is already a member of this organisation");
        }

        member.setOrganisation(invitation.getOrganisation());
        member.setUser(user);
        member.setRole(invitation.getRole());
        member.setActive(true);
        organisationMemberRepository.save(member);

        invitation.setUsed(true);
        invitationRepository.save(invitation);

        auditLogService.logForOrganisation(
            "USER_INVITATION_ACCEPTED",
            "USER",
            user.getId(),
            null,
            user.getEmail(),
            invitation.getOrganisation().getId(),
            ipAddress
        );

        return new AuthResponse(
            user.getId(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            jwtService.generateToken(user.getEmail())
        );
    }

    private Organisation findOrganisation(Long organisationId) {
        return organisationRepository.findById(organisationId)
            .orElseThrow(() -> new IllegalArgumentException("Organisation not found"));
    }

    private Role findRole(Long organisationId, Long roleId) {
        if (roleId != null) {
            return roleRepository.findByIdAndOrganisationId(roleId, organisationId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found in this organisation"));
        }

        return roleRepository.findByOrganisationIdAndNameIgnoreCase(organisationId, MEMBER_ROLE)
            .orElseGet(() -> {
                Role role = new Role();
                role.setName(MEMBER_ROLE);
                role.setDescription("Organisation member");
                role.setOrganisation(findOrganisation(organisationId));
                return roleRepository.save(role);
            });
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private void validateNewAccount(AcceptInvitationRequest request) {
        if (request == null || request.firstName() == null || request.firstName().isBlank()
            || request.lastName() == null || request.lastName().isBlank()
            || request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("First name, last name, and password are required");
        }
        if (request.password().length() < 8) {
            throw new IllegalArgumentException("Password must contain at least 8 characters");
        }
    }

    private void validateActivation(AcceptInvitationRequest request) {
        if (request == null || request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("Password is required to activate this account");
        }
        if (request.password().length() < 8) {
            throw new IllegalArgumentException("Password must contain at least 8 characters");
        }
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Unable to hash invitation token", exception);
        }
    }
}
