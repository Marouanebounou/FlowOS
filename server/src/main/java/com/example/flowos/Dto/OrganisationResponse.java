package com.example.flowos.Dto;

import com.example.flowos.Models.Organisation;

import java.time.LocalDateTime;

public record OrganisationResponse(
    Long id,
    String name,
    String logoUrl,
    String primaryColor,
    LocalDateTime createdAt
) {
    public static OrganisationResponse from(Organisation organisation) {
        return new OrganisationResponse(
            organisation.getId(),
            organisation.getName(),
            organisation.getLogoUrl(),
            organisation.getPrimaryColor(),
            organisation.getCreatedAt()
        );
    }
}
