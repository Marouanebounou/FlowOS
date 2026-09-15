package com.example.flowos.Dto;

import com.example.flowos.Models.User;

import java.time.LocalDateTime;

public record UserProfileResponse(
    Long id,
    String firstName,
    String lastName,
    String email,
    String phoneNumber,
    Boolean active,
    LocalDateTime createdAt
) {
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
            user.getId(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            user.getPhoneNumber(),
            user.getActive(),
            user.getCreatedAt()
        );
    }
}
