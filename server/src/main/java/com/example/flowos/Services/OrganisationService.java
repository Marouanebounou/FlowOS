package com.example.flowos.Services;

import com.example.flowos.Dto.CreateOrganisationRequest;
import com.example.flowos.Dto.OrganisationResponse;
import com.example.flowos.Dto.OrganisationSettingsRequest;
import com.example.flowos.Dto.OrganisationUserResponse;
import com.example.flowos.Dto.UpdateOrganisationRequest;
import com.example.flowos.Models.Organisation;
import com.example.flowos.Models.OrganisationMember;
import com.example.flowos.Models.Role;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.OrganisationRepository;
import com.example.flowos.Repositories.RoleRepository;
import com.example.flowos.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrganisationService {
    private static final String ADMIN_ROLE = "ADMIN";

    private final OrganisationRepository organisationRepository;
    private final OrganisationMemberRepository organisationMemberRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    
    @Transactional
    public OrganisationResponse create(String email, CreateOrganisationRequest request, String ipAddress) {
        User user = findUser(email);

        Organisation organisation = new Organisation();
        organisation.setName(request.name().trim());
        organisation.setLogoUrl(normalize(request.logoUrl()));
        organisation.setPrimaryColor(normalize(request.primaryColor()));
        Organisation savedOrganisation = organisationRepository.save(organisation);

        Role adminRole = new Role();
        adminRole.setName(ADMIN_ROLE);
        adminRole.setDescription("Organisation administrator");
        adminRole.setOrganisation(savedOrganisation);
        Role savedRole = roleRepository.save(adminRole);

        OrganisationMember member = new OrganisationMember();
        member.setOrganisation(savedOrganisation);
        member.setUser(user);
        member.setRole(savedRole);
        organisationMemberRepository.save(member);

        auditLogService.logForOrganisation(
            "ORGANISATION_CREATED",
            "ORGANISATION",
            savedOrganisation.getId(),
            null,
            email,
            savedOrganisation.getId(),
            ipAddress
        );

        return OrganisationResponse.from(savedOrganisation);
    }

    @Transactional(readOnly = true)
    public OrganisationResponse getById(Long organisationId) {
        return OrganisationResponse.from(findOrganisation(organisationId));
    }

    @Transactional(readOnly = true)
    public List<OrganisationUserResponse> listUsers(
        Long organisationId,
        String name,
        String email,
        Boolean active
    ) {
        findOrganisation(organisationId);

        return organisationMemberRepository.findUsersByOrganisationAndFilters(
            organisationId,
            normalizeFilter(name),
            normalizeFilter(email),
            active
        ).stream().map(OrganisationUserResponse::from).toList();
    }

    @Transactional
    public OrganisationUserResponse deactivateUser(
        String adminEmail,
        Long organisationId,
        Long userId,
        String ipAddress
    ) {
        OrganisationMember member = findMember(organisationId, userId);
        preventSelfDeactivation(adminEmail, member);

        member.setActive(false);
        member.getUser().setActive(false);
        organisationMemberRepository.save(member);
        userRepository.save(member.getUser());

        auditLogService.logForOrganisation(
            "USER_DEACTIVATED",
            "USER",
            userId,
            null,
            adminEmail,
            organisationId,
            ipAddress
        );

        return OrganisationUserResponse.from(member);
    }

    @Transactional
    public OrganisationUserResponse reactivateUser(
        String adminEmail,
        Long organisationId,
        Long userId,
        String ipAddress
    ) {
        OrganisationMember member = findMember(organisationId, userId);

        member.setActive(true);
        member.getUser().setActive(true);
        organisationMemberRepository.save(member);
        userRepository.save(member.getUser());

        auditLogService.logForOrganisation(
            "USER_REACTIVATED",
            "USER",
            userId,
            null,
            adminEmail,
            organisationId,
            ipAddress
        );

        return OrganisationUserResponse.from(member);
    }

    @Transactional
    public OrganisationResponse update(
        String email,
        Long organisationId,
        UpdateOrganisationRequest request,
        String ipAddress
    ) {
        Organisation organisation = findOrganisation(organisationId);
        organisation.setName(request.name().trim());
        organisation.setLogoUrl(normalize(request.logoUrl()));
        Organisation savedOrganisation = organisationRepository.save(organisation);

        auditLogService.logForOrganisation(
            "ORGANISATION_UPDATED",
            "ORGANISATION",
            organisationId,
            null,
            email,
            organisationId,
            ipAddress
        );

        return OrganisationResponse.from(savedOrganisation);
    }

    @Transactional
    public OrganisationResponse updateSettings(
        String email,
        Long organisationId,
        OrganisationSettingsRequest request,
        String ipAddress
    ) {
        Organisation organisation = findOrganisation(organisationId);
        if (request.name() != null) {
            if (request.name().isBlank()) {
                throw new IllegalArgumentException("Organisation name cannot be blank");
            }
            organisation.setName(request.name().trim());
        }
        if (request.logoUrl() != null) {
            organisation.setLogoUrl(normalize(request.logoUrl()));
        }
        if (request.primaryColor() != null) {
            organisation.setPrimaryColor(normalize(request.primaryColor()));
        }
        Organisation savedOrganisation = organisationRepository.save(organisation);

        auditLogService.logForOrganisation(
            "ORGANISATION_SETTINGS_UPDATED",
            "ORGANISATION",
            organisationId,
            null,
            email,
            organisationId,
            ipAddress
        );

        return OrganisationResponse.from(savedOrganisation);
    }

    @Transactional
    public void delete(String email, Long organisationId, String ipAddress) {
        findOrganisation(organisationId);

        auditLogService.log(
            "ORGANISATION_DELETED",
            "ORGANISATION",
            organisationId,
            "organisation_id=" + organisationId,
            email,
            ipAddress
        );
        organisationRepository.deleteById(organisationId);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private Organisation findOrganisation(Long organisationId) {
        return organisationRepository.findById(organisationId)
            .orElseThrow(() -> new IllegalArgumentException("Organisation not found"));
    }

    private OrganisationMember findMember(Long organisationId, Long userId) {
        return organisationMemberRepository.findByOrganisationIdAndUserId(organisationId, userId)
            .orElseThrow(() -> new IllegalArgumentException("User is not a member of this organisation"));
    }

    private void preventSelfDeactivation(String adminEmail, OrganisationMember member) {
        if (member.getUser().getEmail().equalsIgnoreCase(adminEmail)) {
            throw new IllegalArgumentException("You cannot deactivate your own account");
        }
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeFilter(String value) {
        return normalize(value);
    }
}
