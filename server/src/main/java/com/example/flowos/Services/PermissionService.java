package com.example.flowos.Services;

import com.example.flowos.Dto.PermissionRequest;
import com.example.flowos.Dto.PermissionResponse;
import com.example.flowos.Models.Permission;
import com.example.flowos.Models.Organisation;
import com.example.flowos.Models.Role;
import com.example.flowos.Repositories.OrganisationRepository;
import com.example.flowos.Repositories.PermissionRepository;
import com.example.flowos.Repositories.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PermissionService {
    private static final Map<String, String> DEFAULT_PERMISSIONS = new LinkedHashMap<>();

    static {
        DEFAULT_PERMISSIONS.put("team.read", "View teams and team members");
        DEFAULT_PERMISSIONS.put("team.create", "Create teams");
        DEFAULT_PERMISSIONS.put("team.update", "Update teams");
        DEFAULT_PERMISSIONS.put("team.delete", "Delete teams");
        DEFAULT_PERMISSIONS.put("team.member.add", "Add users to teams");
        DEFAULT_PERMISSIONS.put("team.member.remove", "Remove users from teams");
        DEFAULT_PERMISSIONS.put("team.leader.assign", "Assign team leaders");
        DEFAULT_PERMISSIONS.put("role.read", "View roles");
        DEFAULT_PERMISSIONS.put("role.create", "Create roles");
        DEFAULT_PERMISSIONS.put("role.update", "Update roles");
        DEFAULT_PERMISSIONS.put("role.delete", "Delete roles");
        DEFAULT_PERMISSIONS.put("role.permission.assign", "Assign permissions to roles");
        DEFAULT_PERMISSIONS.put("permission.read", "View permissions");
        DEFAULT_PERMISSIONS.put("permission.create", "Create permissions");
        DEFAULT_PERMISSIONS.put("permission.update", "Update permissions");
        DEFAULT_PERMISSIONS.put("permission.delete", "Delete permissions");
    }

    private static final Set<String> MANAGER_PERMISSIONS = Set.of(
        "team.read", "team.create", "team.update", "team.member.add",
        "team.member.remove", "team.leader.assign"
    );

    private final OrganisationRepository organisationRepository;
    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final PermissionSecurity permissionSecurity;
    private final AuditLogService auditLogService;

    @Transactional
    public Role createDefaultRoles(Organisation organisation) {
        Map<String, Permission> permissions = ensureDefaultPermissions();
        Role adminRole = createRole(
            organisation,
            "ADMIN",
            "Organisation administrator",
            permissions.keySet(),
            permissions
        );
        createRole(organisation, "MANAGER", "Team manager", MANAGER_PERMISSIONS, permissions);
        createRole(organisation, "EMPLOYEE", "Organisation employee", Set.of("team.read"), permissions);
        createRole(organisation, "MEMBER", "Organisation member", Set.of("team.read"), permissions);
        return adminRole;
    }

    @Transactional
    public Role ensureMemberRole(Long organisationId) {
        Map<String, Permission> permissions = ensureDefaultPermissions();
        Role role = roleRepository.findByOrganisationIdAndNameIgnoreCase(organisationId, "MEMBER")
            .orElseGet(() -> {
                Organisation organisation = organisationRepository.findById(organisationId)
                    .orElseThrow(() -> new IllegalArgumentException("Organisation not found"));
                return createRole(
                    organisation,
                    "MEMBER",
                    "Organisation member",
                    Set.of("team.read"),
                    permissions
                );
            });
        role.getPermissions().add(permissions.get("team.read"));
        return roleRepository.save(role);
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> list(String adminEmail, Long organisationId) {
        requirePermission(adminEmail, organisationId, "permission.read");
        return permissionRepository.findAll().stream().map(PermissionResponse::from).toList();
    }

    @Transactional
    public PermissionResponse create(
        String adminEmail,
        Long organisationId,
        PermissionRequest request,
        String ipAddress
    ) {
        requirePermission(adminEmail, organisationId, "permission.create");
        String code = normalizeCode(request.code());
        if (permissionRepository.findByCode(code).isPresent()) {
            throw new IllegalArgumentException("A permission with this code already exists");
        }

        Permission permission = new Permission();
        permission.setCode(code);
        permission.setDescription(normalize(request.description()));
        Permission savedPermission = permissionRepository.save(permission);
        auditLogService.logForOrganisation(
            "PERMISSION_CREATED",
            "PERMISSION",
            savedPermission.getId(),
            "code=" + code,
            adminEmail,
            organisationId,
            ipAddress
        );
        return PermissionResponse.from(savedPermission);
    }

    @Transactional
    public PermissionResponse update(
        String adminEmail,
        Long organisationId,
        Long permissionId,
        PermissionRequest request,
        String ipAddress
    ) {
        requirePermission(adminEmail, organisationId, "permission.update");
        Permission permission = findPermission(permissionId);
        String code = normalizeCode(request.code());
        if (!permission.getCode().equals(code) && !permission.getRoles().isEmpty()) {
            throw new IllegalArgumentException("Cannot change a permission code while it is assigned to a role");
        }
        permissionRepository.findByCode(code).ifPresent(existing -> {
            if (!existing.getId().equals(permissionId)) {
                throw new IllegalArgumentException("A permission with this code already exists");
            }
        });
        permission.setCode(code);
        permission.setDescription(normalize(request.description()));
        Permission savedPermission = permissionRepository.save(permission);
        auditLogService.logForOrganisation(
            "PERMISSION_UPDATED",
            "PERMISSION",
            permissionId,
            "code=" + code,
            adminEmail,
            organisationId,
            ipAddress
        );
        return PermissionResponse.from(savedPermission);
    }

    @Transactional
    public void delete(
        String adminEmail,
        Long organisationId,
        Long permissionId,
        String ipAddress
    ) {
        requirePermission(adminEmail, organisationId, "permission.delete");
        Permission permission = findPermission(permissionId);
        if (!permission.getRoles().isEmpty()) {
            throw new IllegalArgumentException("Remove this permission from roles before deleting it");
        }
        permissionRepository.delete(permission);
        auditLogService.logForOrganisation(
            "PERMISSION_DELETED",
            "PERMISSION",
            permissionId,
            "code=" + permission.getCode(),
            adminEmail,
            organisationId,
            ipAddress
        );
    }

    private void requirePermission(String email, Long organisationId, String permissionCode) {
        organisationRepository.findById(organisationId)
            .orElseThrow(() -> new IllegalArgumentException("Organisation not found"));
        permissionSecurity.requirePermission(email, organisationId, permissionCode);
    }

    private Map<String, Permission> ensureDefaultPermissions() {
        Map<String, Permission> permissions = new LinkedHashMap<>();
        DEFAULT_PERMISSIONS.forEach((code, description) -> {
            Permission permission = permissionRepository.findByCode(code).orElseGet(() -> {
                Permission created = new Permission();
                created.setCode(code);
                created.setDescription(description);
                return permissionRepository.save(created);
            });
            permissions.put(code, permission);
        });
        return permissions;
    }

    private Role createRole(
        Organisation organisation,
        String name,
        String description,
        Set<String> permissionCodes,
        Map<String, Permission> permissions
    ) {
        Role role = new Role();
        role.setName(name);
        role.setDescription(description);
        role.setOrganisation(organisation);
        role.getPermissions().addAll(permissionCodes.stream().map(permissions::get).toList());
        return roleRepository.save(role);
    }

    private Permission findPermission(Long permissionId) {
        return permissionRepository.findById(permissionId)
            .orElseThrow(() -> new IllegalArgumentException("Permission not found"));
    }

    private String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Permission code is required");
        }
        return code.trim().toLowerCase(Locale.ROOT);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}