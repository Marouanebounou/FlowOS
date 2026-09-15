package com.example.flowos.Dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record OrganisationSettingsRequest(
    @Size(max = 255, message = "Organisation name must not exceed 255 characters")
    String name,
    @Size(max = 500, message = "Logo URL must not exceed 500 characters")
    String logoUrl,
    @Pattern(regexp = "^$|^#[0-9A-Fa-f]{6}$", message = "Primary color must be a hex color")
    String primaryColor
) {
}
