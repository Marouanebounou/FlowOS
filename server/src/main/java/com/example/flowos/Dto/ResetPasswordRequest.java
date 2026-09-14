package com.example.flowos.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
	@NotBlank(message = "Token is required") String token,
	@NotBlank(message = "New password is required") @Size(min = 8, message = "Password must contain at least 8 characters") String newPassword
) {
}
