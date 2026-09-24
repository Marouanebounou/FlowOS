package com.example.flowos.Controllers;

import com.example.flowos.Dto.TaskRequest;
import com.example.flowos.Dto.TaskResponse;
import com.example.flowos.Services.TaskService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organisations/{organisationId}/teams/{teamId}/tasks")
@RequiredArgsConstructor
public class TaskController {
    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<List<TaskResponse>> list(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long teamId
    ) {
        return ResponseEntity.ok(taskService.list(authentication.getName(), organisationId, teamId));
    }

    @PostMapping
    public ResponseEntity<TaskResponse> create(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long teamId,
        @Valid @RequestBody TaskRequest req,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.create(authentication.getName(), organisationId, teamId, req, httpRequest.getRemoteAddr()));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> update(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long teamId,
        @PathVariable Long taskId,
        @Valid @RequestBody TaskRequest req,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(taskService.update(authentication.getName(), organisationId, teamId, taskId, req, httpRequest.getRemoteAddr()));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> delete(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long teamId,
        @PathVariable Long taskId,
        HttpServletRequest httpRequest
    ) {
        taskService.delete(authentication.getName(), organisationId, teamId, taskId, httpRequest.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{taskId}/assign/{userId}")
    public ResponseEntity<TaskResponse> assign(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long teamId,
        @PathVariable Long taskId,
        @PathVariable Long userId,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(taskService.assign(authentication.getName(), organisationId, teamId, taskId, userId, httpRequest.getRemoteAddr()));
    }
}
