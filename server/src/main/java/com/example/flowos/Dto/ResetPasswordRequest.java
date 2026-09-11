package com.example.flowos.Dto;

public record ResetPasswordRequest(String token, String newPassword) {
}
