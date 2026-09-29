package com.example.flowos.Controllers;

import com.example.flowos.Dto.ProjectRequest;
import com.example.flowos.Dto.ProjectResponse;
import com.example.flowos.Services.ProjectService;
import com.example.flowos.Utils.PaginationUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/organisations/{organisationId}/teams/{teamId}/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<Page<ProjectResponse>> list(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long teamId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(projectService.list(authentication.getName(), organisationId, teamId, PaginationUtils.normalize(pageable)));
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> create(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long teamId,
        @Valid @RequestBody ProjectRequest req,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.create(authentication.getName(), organisationId, teamId, req, httpRequest.getRemoteAddr()));
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> update(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long teamId,
        @PathVariable Long projectId,
        @Valid @RequestBody ProjectRequest req,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(projectService.update(authentication.getName(), organisationId, teamId, projectId, req, httpRequest.getRemoteAddr()));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> delete(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long teamId,
        @PathVariable Long projectId,
        HttpServletRequest httpRequest
    ) {
        projectService.delete(authentication.getName(), organisationId, teamId, projectId, httpRequest.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }
}
