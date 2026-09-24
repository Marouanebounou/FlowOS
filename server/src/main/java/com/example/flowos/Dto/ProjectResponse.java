package com.example.flowos.Dto;

import com.example.flowos.Models.Project;

import java.time.LocalDateTime;

public record ProjectResponse(
    Long id,
    String name,
    String description,
    String status,
    Long teamId,
    Long organisationId,
    Long createdById,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static ProjectResponse from(Project p) {
        return new ProjectResponse(
            p.getId(),
            p.getName(),
            p.getDescription(),
            p.getStatus(),
            p.getTeam().getId(),
            p.getOrganisation().getId(),
            p.getCreatedBy().getId(),
            p.getCreatedAt(),
            p.getUpdatedAt()
        );
    }
}
