package com.example.flowos.Dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AcceptInvitationRequest(
    String firstName,
    String lastName,
    @Pattern(regexp = "^[0-9+() -]*$", message = "Phone number is invalid")
    String phoneNumber,
    @Size(min = 8, message = "Password must contain at least 8 characters")
    String password
) {
}
