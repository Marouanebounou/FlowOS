package com.example.flowos.Controllers;

import com.example.flowos.Dto.CreateOrganisationRequest;
import com.example.flowos.Dto.OrganisationResponse;
import com.example.flowos.Dto.OrganisationSettingsRequest;
import com.example.flowos.Dto.OrganisationUserResponse;
import com.example.flowos.Dto.UpdateOrganisationRequest;
import com.example.flowos.Services.OrganisationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organisations")
@RequiredArgsConstructor
public class OrganisationController {
    private final OrganisationService organisationService;

    @GetMapping
    public ResponseEntity<List<OrganisationResponse>> list(Authentication authentication) {
        return ResponseEntity.ok(organisationService.listForUser(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<OrganisationResponse> create(
        Authentication authentication,
        @Valid @RequestBody CreateOrganisationRequest request,
        HttpServletRequest httpRequest
    ) {
        OrganisationResponse response = organisationService.create(
            authentication.getName(),
            request,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{organisationId}/me")
    @PreAuthorize("@permissionSecurity.isMember(authentication, #organisationId)")
    public ResponseEntity<OrganisationUserResponse> myMembership(
        Authentication authentication,
        @PathVariable Long organisationId
    ) {
        return ResponseEntity.ok(organisationService.getMyMembership(authentication.getName(), organisationId));
    }

    @GetMapping("/{organisationId}/me/permissions")
    @PreAuthorize("@permissionSecurity.isMember(authentication, #organisationId)")
    public ResponseEntity<List<String>> myPermissions(
        Authentication authentication,
        @PathVariable Long organisationId
    ) {
        return ResponseEntity.ok(organisationService.getMyPermissions(authentication.getName(), organisationId));
    }

    @GetMapping("/{organisationId}")
    @PreAuthorize("@permissionSecurity.isMember(authentication, #organisationId)")
    public ResponseEntity<OrganisationResponse> getById(@PathVariable Long organisationId) {
        return ResponseEntity.ok(organisationService.getById(organisationId));
    }

    @GetMapping("/{organisationId}/users")
    @PreAuthorize("@permissionSecurity.isAdmin(authentication, #organisationId)")
    public ResponseEntity<List<OrganisationUserResponse>> listUsers(
        @PathVariable Long organisationId,
        @RequestParam(required = false) String name,
        @RequestParam(required = false) String email,
        @RequestParam(required = false) Boolean active
    ) {
        return ResponseEntity.ok(organisationService.listUsers(organisationId, name, email, active));
    }

    @PatchMapping("/{organisationId}/users/{userId}/deactivate")
    @PreAuthorize("@permissionSecurity.isAdmin(authentication, #organisationId)")
    public ResponseEntity<OrganisationUserResponse> deactivateUser(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long userId,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(organisationService.deactivateUser(
            authentication.getName(),
            organisationId,
            userId,
            httpRequest.getRemoteAddr()
        ));
    }

    @PatchMapping("/{organisationId}/users/{userId}/reactivate")
    @PreAuthorize("@permissionSecurity.isAdmin(authentication, #organisationId)")
    public ResponseEntity<OrganisationUserResponse> reactivateUser(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long userId,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(organisationService.reactivateUser(
            authentication.getName(),
            organisationId,
            userId,
            httpRequest.getRemoteAddr()
        ));
    }

    @PutMapping("/{organisationId}")
    @PreAuthorize("@permissionSecurity.isAdmin(authentication, #organisationId)")
    public ResponseEntity<OrganisationResponse> update(
        Authentication authentication,
        @PathVariable Long organisationId,
        @Valid @RequestBody UpdateOrganisationRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(organisationService.update(
            authentication.getName(),
            organisationId,
            request,
            httpRequest.getRemoteAddr()
        ));
    }

    @PatchMapping("/{organisationId}/settings")
    @PreAuthorize("@permissionSecurity.isAdmin(authentication, #organisationId)")
    public ResponseEntity<OrganisationResponse> updateSettings(
        Authentication authentication,
        @PathVariable Long organisationId,
        @Valid @RequestBody OrganisationSettingsRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(organisationService.updateSettings(
            authentication.getName(),
            organisationId,
            request,
            httpRequest.getRemoteAddr()
        ));
    }

    @DeleteMapping("/{organisationId}")
    @PreAuthorize("@permissionSecurity.isAdmin(authentication, #organisationId)")
    public ResponseEntity<Void> delete(
        Authentication authentication,
        @PathVariable Long organisationId,
        HttpServletRequest httpRequest
    ) {
        organisationService.delete(
            authentication.getName(),
            organisationId,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.noContent().build();
    }
}