package com.example.flowos.Controllers;

import com.example.flowos.Dto.AcceptInvitationRequest;
import com.example.flowos.Dto.AuthResponse;
import com.example.flowos.Services.OrganisationInvitationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/invitations")
@RequiredArgsConstructor
public class InvitationController {
    private final OrganisationInvitationService invitationService;

    @PostMapping("/{token}/accept")
    public ResponseEntity<AuthResponse> accept(
        @PathVariable String token,
        @Valid @RequestBody AcceptInvitationRequest request,
        HttpServletRequest httpRequest
    ) {
        AuthResponse response = invitationService.accept(
            token,
            request,
            httpRequest.getRemoteAddr()
        );
        return ResponseEntity.ok(response);
    }
}
