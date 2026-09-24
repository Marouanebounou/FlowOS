package com.example.flowos.Dto;

import com.example.flowos.Models.Module;

import java.time.LocalDateTime;

public record ModuleResponse(
    Long id,
    String name,
    String key,
    String description,
    String version,
    LocalDateTime createdAt
) {
    public static ModuleResponse from(Module m) {
        return new ModuleResponse(m.getId(), m.getName(), m.getKey(), m.getDescription(), m.getVersion(), m.getCreatedAt());
    }
}
