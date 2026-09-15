package com.example.flowos.Services;

import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("permissionSecurity")
@RequiredArgsConstructor
public class PermissionSecurity {
    private final OrganisationMemberRepository organisationMemberRepository;
    private final UserRepository userRepository;

    public boolean hasPermission(Authentication authentication, Long organisationId, String permissionCode) {
        return authentication != null
            && hasPermission(authentication.getName(), organisationId, permissionCode);
    }

    public boolean hasPermission(String email, Long organisationId, String permissionCode) {
        if (!isActiveUser(email) || organisationId == null || permissionCode == null) {
            return false;
        }

        return organisationMemberRepository
            .existsByOrganisationIdAndUserEmailAndActiveTrueAndRolePermissionsCode(
                organisationId,
                email,
                permissionCode
            );
    }

    public void requirePermission(String email, Long organisationId, String permissionCode) {
        if (!hasPermission(email, organisationId, permissionCode)) {
            throw new AccessDeniedException("Permission required: " + permissionCode);
        }
    }

    public boolean isMember(Authentication authentication, Long organisationId) {
        if (!isActiveUser(authentication) || organisationId == null) {
            return false;
        }

        return organisationMemberRepository
            .existsByOrganisationIdAndUserEmailAndActiveTrue(organisationId, authentication.getName());
    }

    public boolean isAdmin(Authentication authentication, Long organisationId) {
        if (!isActiveUser(authentication) || organisationId == null) {
            return false;
        }

        return organisationMemberRepository
            .existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(
                organisationId,
                authentication.getName(),
                "ADMIN"
            );
    }

    private boolean isActiveUser(Authentication authentication) {
        return authentication != null
            && authentication.isAuthenticated()
            && isActiveUser(authentication.getName());
    }

    private boolean isActiveUser(String email) {
        return email != null && userRepository.existsByEmailAndActiveTrue(email);
    }
}