package com.example.flowos.Controllers;

import com.example.flowos.Dto.AuthResponse;
import com.example.flowos.Dto.ChangePasswordRequest;
import com.example.flowos.Dto.ForgotPasswordRequest;
import com.example.flowos.Dto.LoginRequest;
import com.example.flowos.Dto.RegisterRequest;
import com.example.flowos.Dto.ResetPasswordRequest;
import com.example.flowos.Services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
        @Valid @RequestBody RegisterRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(authService.register(request, httpRequest.getRemoteAddr()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(authService.login(request, httpRequest.getRemoteAddr()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
        @RequestHeader("Authorization") String authorizationHeader,
        Authentication authentication,
        HttpServletRequest httpRequest
    ) {
        String token = authorizationHeader.replaceFirst("^Bearer ", "");
        authService.logout(token, authentication.getName(), httpRequest.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(
        Authentication authentication,
        @Valid @RequestBody ChangePasswordRequest request,
        HttpServletRequest httpRequest
    ) {
        authService.changePassword(authentication.getName(), request, httpRequest.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }
}
