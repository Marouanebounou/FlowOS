package com.example.flowos.Dto;

import com.example.flowos.Models.Task;

import java.time.LocalDateTime;

public record TaskResponse(
    Long id,
    String title,
    String description,
    String status,
    String priority,
    Long assigneeId,
    String assigneeName,
    String assigneeEmail,
    Long teamId,
    Long organisationId,
    Long createdById,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static TaskResponse from(Task t) {
        return new TaskResponse(
            t.getId(),
            t.getTitle(),
            t.getDescription(),
            t.getStatus(),
            t.getPriority(),
            t.getAssignee() != null ? t.getAssignee().getId() : null,
            t.getAssignee() != null ? t.getAssignee().getFirstName() + " " + t.getAssignee().getLastName() : null,
            t.getAssignee() != null ? t.getAssignee().getEmail() : null,
            t.getTeam().getId(),
            t.getOrganisation().getId(),
            t.getCreatedBy().getId(),
            t.getCreatedAt(),
            t.getUpdatedAt()
        );
    }
}
