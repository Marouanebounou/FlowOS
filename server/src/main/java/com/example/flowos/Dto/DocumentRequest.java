package com.example.flowos.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DocumentRequest(
    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name max 255")
    String name,

    @Size(max = 2000, message = "Description max 2000")
    String description,

    @NotBlank(message = "File URL is required")
    @Size(max = 1000, message = "File URL max 1000")
    String fileUrl,

    @Size(max = 100, message = "Mime type max 100")
    String mimeType,

    Long sizeBytes,

    Long teamId
) {}
