package com.example.flowos.Services;

import com.example.flowos.Dto.UpdateProfileRequest;
import com.example.flowos.Dto.UserProfileResponse;
import com.example.flowos.Models.OrganisationMember;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final OrganisationMemberRepository organisationMemberRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        return UserProfileResponse.from(findUser(email));
    }

    @Transactional
    public UserProfileResponse updateProfile(
        String email,
        UpdateProfileRequest request,
        String ipAddress
    ) {
        User user = findUser(email);
        User savedUser = userRepository.save(updateFields(user, request));
        auditLogService.log(
            "USER_PROFILE_UPDATED",
            "USER",
            savedUser.getId(),
            null,
            savedUser.getEmail(),
            ipAddress
        );
        return UserProfileResponse.from(savedUser);
    }

    @Transactional
    public UserProfileResponse updateOrganisationUser(
        String adminEmail,
        Long organisationId,
        Long userId,
        UpdateProfileRequest request,
        String ipAddress
    ) {
        OrganisationMember member = organisationMemberRepository
            .findByOrganisationIdAndUserId(organisationId, userId)
            .orElseThrow(() -> new IllegalArgumentException("User is not a member of this organisation"));

        User user = updateFields(member.getUser(), request);
        User savedUser = userRepository.save(user);
        auditLogService.logForOrganisation(
            "USER_PROFILE_UPDATED",
            "USER",
            savedUser.getId(),
            "updated_by=" + adminEmail,
            adminEmail,
            organisationId,
            ipAddress
        );
        return UserProfileResponse.from(savedUser);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private String requireName(String value, String fieldName) {
        if (value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " cannot be blank");
        }
        return value.trim();
    }

    private String normalizePhoneNumber(String value) {
        String trimmedValue = value.trim();
        return trimmedValue.isEmpty() ? null : trimmedValue;
    }

    private User updateFields(User user, UpdateProfileRequest request) {
        if (request.firstName() != null) {
            user.setFirstName(requireName(request.firstName(), "First name"));
        }
        if (request.lastName() != null) {
            user.setLastName(requireName(request.lastName(), "Last name"));
        }
        if (request.phoneNumber() != null) {
            user.setPhoneNumber(normalizePhoneNumber(request.phoneNumber()));
        }
        return user;
    }
}
