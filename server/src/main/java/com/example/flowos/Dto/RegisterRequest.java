package com.example.flowos.Dto;

public record RegisterRequest(
    String firstName,
    String lastName,
    String email,
    String phoneNumber,
    String password
) {
}
