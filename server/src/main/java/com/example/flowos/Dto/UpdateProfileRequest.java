package com.example.flowos.Dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(max = 255, message = "First name must not exceed 255 characters")
    String firstName,
    @Size(max = 255, message = "Last name must not exceed 255 characters")
    String lastName,
    @Pattern(regexp = "^[0-9+() -]*$", message = "Phone number is invalid")
    String phoneNumber
) {
}
