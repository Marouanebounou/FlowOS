package com.example.flowos.Dto;

import com.example.flowos.Models.OrganisationMember;

import java.time.LocalDateTime;

public record OrganisationUserResponse(
    Long userId,
    String firstName,
    String lastName,
    String email,
    String phoneNumber,
    Boolean userActive,
    Boolean membershipActive,
    Long roleId,
    String roleName,
    LocalDateTime joinedAt
) {
    public static OrganisationUserResponse from(OrganisationMember member) {
        return new OrganisationUserResponse(
            member.getUser().getId(),
            member.getUser().getFirstName(),
            member.getUser().getLastName(),
            member.getUser().getEmail(),
            member.getUser().getPhoneNumber(),
            member.getUser().getActive(),
            member.getActive(),
            member.getRole().getId(),
            member.getRole().getName(),
            member.getJoinedAt()
        );
    }
}
