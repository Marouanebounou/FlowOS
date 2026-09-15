package com.example.flowos.Dto;

import com.example.flowos.Models.Role;

import java.time.LocalDateTime;
import java.util.List;

public record RoleResponse(
    Long id,
    Long organisationId,
    String name,
    String description,
    List<PermissionResponse> permissions,
    int memberCount,
    LocalDateTime createdAt
) {
    public static RoleResponse from(Role role) {
        return new RoleResponse(
            role.getId(),
            role.getOrganisation().getId(),
            role.getName(),
            role.getDescription(),
            role.getPermissions().stream().map(PermissionResponse::from).toList(),
            role.getMembers().size(),
            role.getCreatedAt()
        );
    }
}
