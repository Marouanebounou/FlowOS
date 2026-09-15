package com.example.flowos.Dto;

import com.example.flowos.Models.Permission;

public record PermissionResponse(
    Long id,
    String code,
    String description
) {
    public static PermissionResponse from(Permission permission) {
        return new PermissionResponse(
            permission.getId(),
            permission.getCode(),
            permission.getDescription()
        );
    }
}
