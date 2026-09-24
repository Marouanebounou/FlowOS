package com.example.flowos.Dto;

import com.example.flowos.Models.Document;

import java.time.LocalDateTime;

public record DocumentResponse(
    Long id,
    String name,
    String description,
    String fileUrl,
    String mimeType,
    Long sizeBytes,
    Long teamId,
    String teamName,
    Long organisationId,
    Long uploadedById,
    String uploadedByName,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static DocumentResponse from(Document d) {
        return new DocumentResponse(
            d.getId(), d.getName(), d.getDescription(), d.getFileUrl(), d.getMimeType(), d.getSizeBytes(),
            d.getTeam() != null ? d.getTeam().getId() : null,
            d.getTeam() != null ? d.getTeam().getName() : null,
            d.getOrganisation().getId(),
            d.getUploadedBy().getId(),
            d.getUploadedBy().getFirstName() + " " + d.getUploadedBy().getLastName(),
            d.getCreatedAt(), d.getUpdatedAt()
        );
    }
}
