package com.example.flowos.Services;

import com.example.flowos.Dto.PermissionAssignmentRequest;
import com.example.flowos.Dto.PermissionResponse;
import com.example.flowos.Dto.RoleRequest;
import com.example.flowos.Dto.RoleResponse;
import com.example.flowos.Models.Organisation;
import com.example.flowos.Models.Permission;
import com.example.flowos.Models.Role;
import com.example.flowos.Repositories.OrganisationRepository;
import com.example.flowos.Repositories.PermissionRepository;
import com.example.flowos.Repositories.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RoleService {
    private static final String ADMIN_ROLE = "ADMIN";

    private final OrganisationRepository organisationRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final AuditLogService auditLogService;
    private final PermissionSecurity permissionSecurity;

    @Transactional(readOnly = true)
    public List<RoleResponse> list(String adminEmail, Long organisationId) {
        permissionSecurity.requirePermission(adminEmail, organisationId, "role.read");
        findOrganisation(organisationId);
        return roleRepository.findByOrganisationId(organisationId)
            .stream()
            .map(RoleResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public RoleResponse get(String adminEmail, Long organisationId, Long roleId) {
        permissionSecurity.requirePermission(adminEmail, organisationId, "role.read");
        return RoleResponse.from(findRole(organisationId, roleId));
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> listPermissions(String adminEmail, Long organisationId) {
        permissionSecurity.requirePermission(adminEmail, organisationId, "permission.read");
        findOrganisation(organisationId);
        return permissionRepository.findAll()
            .stream()
            .map(PermissionResponse::from)
            .toList();
    }

    @Transactional
    public RoleResponse create(
        String adminEmail,
        Long organisationId,
        RoleRequest request,
        String ipAddress
    ) {
        permissionSecurity.requirePermission(adminEmail, organisationId, "role.create");
        Organisation organisation = findOrganisation(organisationId);
        String name = normalizeName(request.name());
        ensureNameAvailable(organisationId, name, null);

        Role role = new Role();
        role.setName(name);
        role.setDescription(normalize(request.description()));
        role.setOrganisation(organisation);
        Role savedRole = roleRepository.save(role);

        auditLogService.logForOrganisation(
            "ROLE_CREATED",
            "ROLE",
            savedRole.getId(),
            null,
            adminEmail,
            organisationId,
            ipAddress
        );
        return RoleResponse.from(savedRole);
    }

    @Transactional
    public RoleResponse update(
        String adminEmail,
        Long organisationId,
        Long roleId,
        RoleRequest request,
        String ipAddress
    ) {
        permissionSecurity.requirePermission(adminEmail, organisationId, "role.update");
        Role role = findRole(organisationId, roleId);
        String name = normalizeName(request.name());
        if (ADMIN_ROLE.equalsIgnoreCase(role.getName()) && !ADMIN_ROLE.equalsIgnoreCase(name)) {
            throw new IllegalArgumentException("The ADMIN role cannot be renamed");
        }
        ensureNameAvailable(organisationId, name, roleId);
        role.setName(name);
        role.setDescription(normalize(request.description()));
        Role savedRole = roleRepository.save(role);

        auditLogService.logForOrganisation(
            "ROLE_UPDATED",
            "ROLE",
            roleId,
            null,
            adminEmail,
            organisationId,
            ipAddress
        );
        return RoleResponse.from(savedRole);
    }

    @Transactional
    public RoleResponse assignPermissions(
        String adminEmail,
        Long organisationId,
        Long roleId,
        PermissionAssignmentRequest request,
        String ipAddress
    ) {
        permissionSecurity.requirePermission(adminEmail, organisationId, "role.permission.assign");
        Role role = findRole(organisationId, roleId);
        Set<String> codes = normalizePermissionCodes(request.permissionCodes());
        List<Permission> permissions = permissionRepository.findByCodeIn(codes);
        if (permissions.size() != codes.size()) {
            Set<String> foundCodes = permissions.stream().map(Permission::getCode).collect(java.util.stream.Collectors.toSet());
            codes.removeAll(foundCodes);
            throw new IllegalArgumentException("Unknown permission codes: " + String.join(", ", codes));
        }

        role.getPermissions().clear();
        role.getPermissions().addAll(permissions);
        Role savedRole = roleRepository.save(role);
        auditLogService.logForOrganisation(
            "ROLE_PERMISSIONS_UPDATED",
            "ROLE",
            roleId,
            "permission_count=" + permissions.size(),
            adminEmail,
            organisationId,
            ipAddress
        );
        return RoleResponse.from(savedRole);
    }

    @Transactional
    public void delete(String adminEmail, Long organisationId, Long roleId, String ipAddress) {
        permissionSecurity.requirePermission(adminEmail, organisationId, "role.delete");
        Role role = findRole(organisationId, roleId);
        if (ADMIN_ROLE.equalsIgnoreCase(role.getName())) {
            throw new IllegalArgumentException("The ADMIN role cannot be deleted");
        }
        if (!role.getMembers().isEmpty()) {
            throw new IllegalArgumentException("Reassign the role members before deleting this role");
        }

        roleRepository.delete(role);
        auditLogService.logForOrganisation(
            "ROLE_DELETED",
            "ROLE",
            roleId,
            null,
            adminEmail,
            organisationId,
            ipAddress
        );
    }

    private Organisation findOrganisation(Long organisationId) {
        return organisationRepository.findById(organisationId)
            .orElseThrow(() -> new IllegalArgumentException("Organisation not found"));
    }

    private Role findRole(Long organisationId, Long roleId) {
        return roleRepository.findByIdAndOrganisationId(roleId, organisationId)
            .orElseThrow(() -> new IllegalArgumentException("Role not found in this organisation"));
    }

    private void ensureNameAvailable(Long organisationId, String name, Long excludedRoleId) {
        boolean exists = roleRepository.existsByOrganisationIdAndNameIgnoreCase(organisationId, name);
        if (exists && (excludedRoleId == null
            || roleRepository.findByIdAndOrganisationId(excludedRoleId, organisationId)
                .map(role -> !role.getName().equalsIgnoreCase(name))
                .orElse(true))) {
            throw new IllegalArgumentException("A role with this name already exists");
        }
    }

    private Set<String> normalizePermissionCodes(List<String> permissionCodes) {
        Set<String> codes = new HashSet<>();
        for (String code : permissionCodes) {
            if (code == null || code.isBlank()) {
                throw new IllegalArgumentException("Permission codes cannot be blank");
            }
            codes.add(code.trim());
        }
        return codes;
    }

    private String normalizeName(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Role name is required");
        }
        return value.trim();
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
