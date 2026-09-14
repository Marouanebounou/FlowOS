package com.example.flowos.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateOrganisationRequest(
    @NotBlank(message = "Organisation name is required")
    @Size(max = 255, message = "Organisation name must not exceed 255 characters")
    String name,
    @Size(max = 500, message = "Logo URL must not exceed 500 characters")
    String logoUrl,
    @Size(max = 20, message = "Primary color must not exceed 20 characters")
    String primaryColor
) {
}
