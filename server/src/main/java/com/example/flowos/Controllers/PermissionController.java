package com.example.flowos.Controllers;

import com.example.flowos.Dto.PermissionRequest;
import com.example.flowos.Dto.PermissionResponse;
import com.example.flowos.Services.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organisations/{organisationId}/permissions")
@RequiredArgsConstructor
public class PermissionController {
    private final PermissionService permissionService;

    @GetMapping
    public ResponseEntity<List<PermissionResponse>> list(
        Authentication authentication,
        @PathVariable Long organisationId
    ) {
        return ResponseEntity.ok(permissionService.list(authentication.getName(), organisationId));
    }

    @PostMapping
    public ResponseEntity<PermissionResponse> create(
        Authentication authentication,
        @PathVariable Long organisationId,
        @Valid @RequestBody PermissionRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(permissionService.create(
            authentication.getName(), organisationId, request, httpRequest.getRemoteAddr()
        ));
    }

    @PutMapping("/{permissionId}")
    public ResponseEntity<PermissionResponse> update(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long permissionId,
        @Valid @RequestBody PermissionRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(permissionService.update(
            authentication.getName(), organisationId, permissionId, request, httpRequest.getRemoteAddr()
        ));
    }

    @DeleteMapping("/{permissionId}")
    public ResponseEntity<Void> delete(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long permissionId,
        HttpServletRequest httpRequest
    ) {
        permissionService.delete(
            authentication.getName(), organisationId, permissionId, httpRequest.getRemoteAddr()
        );
        return ResponseEntity.noContent().build();
    }
}