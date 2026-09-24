package com.example.flowos.Controllers;

import com.example.flowos.Dto.InstalledModuleResponse;
import com.example.flowos.Dto.ModuleTeamResponse;
import com.example.flowos.Services.ModuleService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/organisations/{organisationId}/modules")
@RequiredArgsConstructor
public class OrganisationModuleController {
    private final ModuleService moduleService;

    @GetMapping
    public ResponseEntity<List<InstalledModuleResponse>> installed(
        Authentication authentication,
        @PathVariable Long organisationId
    ) {
        return ResponseEntity.ok(moduleService.installed(authentication.getName(), organisationId));
    }

    @PostMapping("/{moduleKey}")
    public ResponseEntity<InstalledModuleResponse> install(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable String moduleKey,
        HttpServletRequest request
    ) {
        return ResponseEntity.ok(moduleService.install(authentication.getName(), organisationId, moduleKey, request.getRemoteAddr()));
    }

    @DeleteMapping("/{moduleKey}")
    public ResponseEntity<Void> uninstall(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable String moduleKey,
        HttpServletRequest request
    ) {
        moduleService.uninstall(authentication.getName(), organisationId, moduleKey, request.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{moduleKey}")
    public ResponseEntity<InstalledModuleResponse> setEnabled(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable String moduleKey,
        @RequestBody Map<String, Boolean> body,
        HttpServletRequest request
    ) {
        Boolean enabled = body.get("enabled");
        if (enabled == null) throw new IllegalArgumentException("enabled is required");
        return ResponseEntity.ok(moduleService.setEnabled(authentication.getName(), organisationId, moduleKey, enabled, request.getRemoteAddr()));
    }

    @PutMapping("/{moduleKey}/responsable/{userId}")
    public ResponseEntity<InstalledModuleResponse> setResponsable(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable String moduleKey,
        @PathVariable Long userId,
        HttpServletRequest request
    ) {
        return ResponseEntity.ok(moduleService.setResponsable(authentication.getName(), organisationId, moduleKey, userId, request.getRemoteAddr()));
    }

    @GetMapping("/{moduleKey}/teams")
    public ResponseEntity<List<ModuleTeamResponse>> listTeams(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable String moduleKey
    ) {
        return ResponseEntity.ok(moduleService.listModuleTeams(authentication.getName(), organisationId, moduleKey));
    }

    @PostMapping("/{moduleKey}/teams/{teamId}")
    public ResponseEntity<ModuleTeamResponse> addTeam(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable String moduleKey,
        @PathVariable Long teamId,
        HttpServletRequest request
    ) {
        return ResponseEntity.ok(moduleService.addModuleTeam(authentication.getName(), organisationId, moduleKey, teamId, request.getRemoteAddr()));
    }

    @DeleteMapping("/{moduleKey}/teams/{teamId}")
    public ResponseEntity<Void> removeTeam(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable String moduleKey,
        @PathVariable Long teamId,
        HttpServletRequest request
    ) {
        moduleService.removeModuleTeam(authentication.getName(), organisationId, moduleKey, teamId, request.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }
}
