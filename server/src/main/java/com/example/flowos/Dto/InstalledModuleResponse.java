package com.example.flowos.Dto;

import com.example.flowos.Models.InstalledModule;

import java.time.LocalDateTime;

public record InstalledModuleResponse(
    Long id,
    Long organisationId,
    Long moduleId,
    String moduleKey,
    String moduleName,
    String description,
    String version,
    Boolean enabled,
    LocalDateTime installedAt
) {
    public static InstalledModuleResponse from(InstalledModule im) {
        return new InstalledModuleResponse(
            im.getId(),
            im.getOrganisation().getId(),
            im.getModule().getId(),
            im.getModule().getKey(),
            im.getModule().getName(),
            im.getModule().getDescription(),
            im.getModule().getVersion(),
            im.getEnabled(),
            im.getInstalledAt()
        );
    }
}
