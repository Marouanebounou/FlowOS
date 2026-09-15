package com.example.flowos.Controllers;

import com.example.flowos.Dto.PermissionAssignmentRequest;
import com.example.flowos.Dto.PermissionResponse;
import com.example.flowos.Dto.RoleRequest;
import com.example.flowos.Dto.RoleResponse;
import com.example.flowos.Services.RoleService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organisations/{organisationId}/roles")
@RequiredArgsConstructor
public class RoleController {
    private final RoleService roleService;

    @GetMapping
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'role.read')")
    public ResponseEntity<List<RoleResponse>> list(
        Authentication authentication,
        @PathVariable Long organisationId
    ) {
        return ResponseEntity.ok(roleService.list(authentication.getName(), organisationId));
    }

    @GetMapping("/{roleId}")
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'role.read')")
    public ResponseEntity<RoleResponse> get(
        @PathVariable Long organisationId,
        @PathVariable Long roleId,
        Authentication authentication
    ) {
        return ResponseEntity.ok(roleService.get(authentication.getName(), organisationId, roleId));
    }

    @GetMapping("/permissions")
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'permission.read')")
    public ResponseEntity<List<PermissionResponse>> listPermissions(
        Authentication authentication,
        @PathVariable Long organisationId
    ) {
        return ResponseEntity.ok(roleService.listPermissions(authentication.getName(), organisationId));
    }

    @PostMapping
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'role.create')")
    public ResponseEntity<RoleResponse> create(
        Authentication authentication,
        @PathVariable Long organisationId,
        @Valid @RequestBody RoleRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.create(
            authentication.getName(), organisationId, request, httpRequest.getRemoteAddr()
        ));
    }

    @PutMapping("/{roleId}")
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'role.update')")
    public ResponseEntity<RoleResponse> update(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long roleId,
        @Valid @RequestBody RoleRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(roleService.update(
            authentication.getName(), organisationId, roleId, request, httpRequest.getRemoteAddr()
        ));
    }

    @PutMapping("/{roleId}/permissions")
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'role.permission.assign')")
    public ResponseEntity<RoleResponse> assignPermissions(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long roleId,
        @Valid @RequestBody PermissionAssignmentRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(roleService.assignPermissions(
            authentication.getName(), organisationId, roleId, request, httpRequest.getRemoteAddr()
        ));
    }

    @DeleteMapping("/{roleId}")
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'role.delete')")
    public ResponseEntity<Void> delete(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long roleId,
        HttpServletRequest httpRequest
    ) {
        roleService.delete(authentication.getName(), organisationId, roleId, httpRequest.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }
}
