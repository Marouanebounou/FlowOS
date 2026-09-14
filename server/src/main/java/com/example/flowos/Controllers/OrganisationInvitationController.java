package com.example.flowos.Controllers;

import com.example.flowos.Dto.InviteUserRequest;
import com.example.flowos.Services.OrganisationInvitationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/organisations/{organisationId}/invitations")
@RequiredArgsConstructor
public class OrganisationInvitationController {
    private final OrganisationInvitationService invitationService;

    @PostMapping
    @PreAuthorize("@permissionSecurity.isAdmin(authentication, #organisationId)")
    public ResponseEntity<Void> invite(
        Authentication authentication,
        @PathVariable Long organisationId,
        @Valid @RequestBody InviteUserRequest request,
        HttpServletRequest httpRequest
    ) {
        invitationService.invite(
            authentication.getName(),
            organisationId,
            request,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.accepted().build();
    }
}
