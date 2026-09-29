package com.example.flowos.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TaskRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title max 255")
    String title,

    @Size(max = 2000, message = "Description max 2000")
    String description,

    String status, 

    String priority, 

    Long assigneeId
) {}
