package com.example.flowos.Dto;

import com.example.flowos.Models.TeamMember;

import java.time.LocalDateTime;

public record TeamMemberResponse(
    Long userId,
    String firstName,
    String lastName,
    String email,
    Boolean leader,
    LocalDateTime addedAt
) {
    public static TeamMemberResponse from(TeamMember member) {
        return new TeamMemberResponse(
            member.getOrganisationMember().getUser().getId(),
            member.getOrganisationMember().getUser().getFirstName(),
            member.getOrganisationMember().getUser().getLastName(),
            member.getOrganisationMember().getUser().getEmail(),
            member.getLeader(),
            member.getAddedAt()
        );
    }
}
