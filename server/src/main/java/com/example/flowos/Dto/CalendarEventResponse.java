package com.example.flowos.Dto;

import com.example.flowos.Models.CalendarEvent;

import java.time.LocalDateTime;

public record CalendarEventResponse(
    Long id,
    String title,
    String description,
    String location,
    LocalDateTime startAt,
    LocalDateTime endAt,
    Long teamId,
    String teamName,
    Long organisationId,
    Long createdById,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static CalendarEventResponse from(CalendarEvent e) {
        return new CalendarEventResponse(
            e.getId(),
            e.getTitle(),
            e.getDescription(),
            e.getLocation(),
            e.getStartAt(),
            e.getEndAt(),
            e.getTeam() != null ? e.getTeam().getId() : null,
            e.getTeam() != null ? e.getTeam().getName() : null,
            e.getOrganisation().getId(),
            e.getCreatedBy().getId(),
            e.getCreatedAt(),
            e.getUpdatedAt()
        );
    }
}
