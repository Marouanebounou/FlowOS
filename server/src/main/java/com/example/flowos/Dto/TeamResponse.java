package com.example.flowos.Dto;

import com.example.flowos.Models.Team;

import java.time.LocalDateTime;

public record TeamResponse(
    Long id,
    Long organisationId,
    String name,
    int memberCount,
    LocalDateTime createdAt
) {
    public static TeamResponse from(Team team) {
        return new TeamResponse(
            team.getId(),
            team.getOrganisation().getId(),
            team.getName(),
            team.getMembers().size(),
            team.getCreatedAt()
        );
    }
}
