package com.example.flowos.Controllers;

import com.example.flowos.Dto.TeamRequest;
import com.example.flowos.Dto.TeamResponse;
import com.example.flowos.Dto.TeamMemberRequest;
import com.example.flowos.Dto.TeamMemberResponse;
import com.example.flowos.Services.TeamService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/v1/organisations/{organisationId}/teams")
@RequiredArgsConstructor
public class TeamController {
    private final TeamService teamService;

    @GetMapping
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'team.read')")
    public ResponseEntity<List<TeamResponse>> list(Authentication authentication, @PathVariable Long organisationId) {
        return ResponseEntity.ok(teamService.list(authentication.getName(), organisationId));
    }

    @GetMapping("/{teamId}")
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'team.read')")
    public ResponseEntity<TeamResponse> get(
        @PathVariable Long organisationId,
        @PathVariable Long teamId,
        Authentication authentication
    ) {
        return ResponseEntity.ok(teamService.get(authentication.getName(), organisationId, teamId));
    }

    @GetMapping("/{teamId}/members")
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'team.read')")
    public ResponseEntity<List<TeamMemberResponse>> listMembers(
        @PathVariable Long organisationId,
        @PathVariable Long teamId,
        Authentication authentication
    ) {
        return ResponseEntity.ok(teamService.listMembers(authentication.getName(), organisationId, teamId));
    }

    @PostMapping
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'team.create')")
    public ResponseEntity<TeamResponse> create(
        Authentication authentication,
        @PathVariable Long organisationId,
        @Valid @RequestBody TeamRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teamService.create(
            authentication.getName(), organisationId, request, httpRequest.getRemoteAddr()
        ));
    }

    @PutMapping("/{teamId}")
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'team.update')")
    public ResponseEntity<TeamResponse> update(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long teamId,
        @Valid @RequestBody TeamRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(teamService.update(
            authentication.getName(), organisationId, teamId, request, httpRequest.getRemoteAddr()
        ));
    }

    @PostMapping("/{teamId}/members")
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'team.member.add')")
    public ResponseEntity<TeamMemberResponse> addMember(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long teamId,
        @Valid @RequestBody TeamMemberRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teamService.addMember(
            authentication.getName(), organisationId, teamId, request.userId(), httpRequest.getRemoteAddr()
        ));
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'team.member.remove')")
    public ResponseEntity<Void> removeMember(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long teamId,
        @PathVariable Long userId,
        HttpServletRequest httpRequest
    ) {
        teamService.removeMember(
            authentication.getName(), organisationId, teamId, userId, httpRequest.getRemoteAddr()
        );
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{teamId}/leader/{userId}")
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'team.leader.assign')")
    public ResponseEntity<TeamMemberResponse> assignLeader(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long teamId,
        @PathVariable Long userId,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(teamService.assignLeader(
            authentication.getName(), organisationId, teamId, userId, httpRequest.getRemoteAddr()
        ));
    }

    @DeleteMapping("/{teamId}")
    @PreAuthorize("@permissionSecurity.hasPermission(authentication, #organisationId, 'team.delete')")
    public ResponseEntity<Void> delete(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long teamId,
        HttpServletRequest httpRequest
    ) {
        teamService.delete(authentication.getName(), organisationId, teamId, httpRequest.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }
}
