package com.example.flowos.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record InviteUserRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Email is invalid")
    String email,
    Long roleId
) {
}
