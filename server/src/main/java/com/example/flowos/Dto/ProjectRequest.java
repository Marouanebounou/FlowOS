package com.example.flowos.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
    @NotBlank(message = "Project name is required")
    @Size(max = 255, message = "Name max 255")
    String name,

    @Size(max = 2000, message = "Description max 2000")
    String description,

    String status
) {}
