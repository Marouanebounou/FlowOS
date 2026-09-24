package com.example.flowos.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CrmContactRequest(
    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name max 255")
    String name,

    @Size(max = 255, message = "Email max 255")
    String email,

    @Size(max = 255, message = "Phone max 255")
    String phone,

    @Size(max = 255, message = "Company max 255")
    String company,

    String status,

    @Size(max = 2000, message = "Notes max 2000")
    String notes,

    Long teamId
) {}
