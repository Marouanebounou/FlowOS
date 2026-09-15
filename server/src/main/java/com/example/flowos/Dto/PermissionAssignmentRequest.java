package com.example.flowos.Dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record PermissionAssignmentRequest(
    @NotNull(message = "Permission codes are required")
    List<String> permissionCodes
) {
}
