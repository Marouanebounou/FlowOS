package com.example.flowos.Dto;

public record AuthResponse(Long userId, String firstName, String lastName, String email, String token) {
}
