package com.example.flowos.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PermissionRequest(
    @NotBlank(message = "Permission code is required")
    @Size(max = 255, message = "Permission code must not exceed 255 characters")
    @Pattern(
        regexp = "[a-z][a-z0-9]*(\\.[a-z][a-z0-9]*)+",
        message = "Permission code must use lowercase dot-separated words"
    )
    String code,
    @Size(max = 255, message = "Permission description must not exceed 255 characters")
    String description
) {
}