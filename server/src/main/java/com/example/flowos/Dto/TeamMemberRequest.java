package com.example.flowos.Dto;

import jakarta.validation.constraints.NotNull;

public record TeamMemberRequest(
    @NotNull(message = "User ID is required")
    Long userId
) {
}
