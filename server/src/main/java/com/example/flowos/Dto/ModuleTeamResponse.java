package com.example.flowos.Dto;

import com.example.flowos.Models.ModuleTeam;

import java.time.LocalDateTime;

public record ModuleTeamResponse(
    Long id,
    Long teamId,
    String teamName,
    Long addedById,
    String addedByName,
    LocalDateTime addedAt
) {
    public static ModuleTeamResponse from(ModuleTeam mt) {
        return new ModuleTeamResponse(
            mt.getId(),
            mt.getTeam().getId(),
            mt.getTeam().getName(),
            mt.getAddedBy().getId(),
            mt.getAddedBy().getFirstName() + " " + mt.getAddedBy().getLastName(),
            mt.getAddedAt()
        );
    }
}
