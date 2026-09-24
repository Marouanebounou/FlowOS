package com.example.flowos.Dto;

import com.example.flowos.Models.CrmContact;

import java.time.LocalDateTime;

public record CrmContactResponse(
    Long id,
    String name,
    String email,
    String phone,
    String company,
    String status,
    String notes,
    Long teamId,
    String teamName,
    Long organisationId,
    Long createdById,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static CrmContactResponse from(CrmContact c) {
        return new CrmContactResponse(
            c.getId(), c.getName(), c.getEmail(), c.getPhone(), c.getCompany(), c.getStatus(), c.getNotes(),
            c.getTeam() != null ? c.getTeam().getId() : null,
            c.getTeam() != null ? c.getTeam().getName() : null,
            c.getOrganisation().getId(), c.getCreatedBy().getId(), c.getCreatedAt(), c.getUpdatedAt()
        );
    }
}
