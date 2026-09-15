package com.example.flowos.Controllers;

import com.example.flowos.Dto.UpdateProfileRequest;
import com.example.flowos.Dto.UserProfileResponse;
import com.example.flowos.Services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getProfile(authentication.getName()));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserProfileResponse> updateProfile(
        Authentication authentication,
        @Valid @RequestBody UpdateProfileRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(userService.updateProfile(
            authentication.getName(),
            request,
            httpRequest.getRemoteAddr()
        ));
    }

    @PatchMapping("/organisations/{organisationId}/users/{userId}")
    @PreAuthorize("@permissionSecurity.isAdmin(authentication, #organisationId)")
    public ResponseEntity<UserProfileResponse> updateOrganisationUser(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long userId,
        @Valid @RequestBody UpdateProfileRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(userService.updateOrganisationUser(
            authentication.getName(),
            organisationId,
            userId,
            request,
            httpRequest.getRemoteAddr()
        ));
    }
}
