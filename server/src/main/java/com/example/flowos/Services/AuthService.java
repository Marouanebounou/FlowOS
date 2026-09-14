package com.example.flowos.Services;

import com.example.flowos.Dto.AuthResponse;
import com.example.flowos.Dto.ChangePasswordRequest;
import com.example.flowos.Dto.ForgotPasswordRequest;
import com.example.flowos.Dto.LoginRequest;
import com.example.flowos.Dto.RegisterRequest;
import com.example.flowos.Dto.ResetPasswordRequest;
import com.example.flowos.Models.BlacklistedToken;
import com.example.flowos.Models.PasswordResetToken;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.BlacklistedTokenRepository;
import com.example.flowos.Repositories.PasswordResetTokenRepository;
import com.example.flowos.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final long RESET_TOKEN_VALID_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final BlacklistedTokenRepository blacklistedTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AuditLogService auditLogService;

    public AuthResponse register(RegisterRequest request, String ipAddress) {
        validateRegistration(request);

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = new User();
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        user.setPhoneNumber(request.phoneNumber());
        user.setPassword(passwordEncoder.encode(request.password()));

        User savedUser = userRepository.save(user);
        auditLogService.log("USER_REGISTERED", "USER", savedUser.getId(), null, savedUser.getEmail(), ipAddress);
        return toAuthResponse(savedUser, jwtService.generateToken(savedUser.getEmail()));
    }

    public AuthResponse login(LoginRequest request, String ipAddress) {
        if (isBlank(request.email()) || isBlank(request.password())) {
            throw new IllegalArgumentException("Email and password are required");
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            auditLogService.log("LOGIN_FAILED", "USER", null, "invalid_credentials", null, ipAddress);
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (!user.getActive() || !passwordEncoder.matches(request.password(), user.getPassword())) {
            auditLogService.log("LOGIN_FAILED", "USER", user.getId(), "invalid_credentials", user.getEmail(), ipAddress);
            throw new IllegalArgumentException("Invalid email or password");
        }

        auditLogService.log("LOGIN", "USER", user.getId(), null, user.getEmail(), ipAddress);
        return toAuthResponse(user, jwtService.generateToken(user.getEmail()));
    }

    public void logout(String token, String email, String ipAddress) {
        if (isBlank(token)) {
            throw new IllegalArgumentException("Token is required");
        }
        if (blacklistedTokenRepository.existsByToken(token)) {
            return;
        }

        BlacklistedToken blacklistedToken = new BlacklistedToken();
        blacklistedToken.setToken(token);
        blacklistedToken.setExpiresAt(
            jwtService.extractExpiration(token).toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime()
        );
        blacklistedTokenRepository.save(blacklistedToken);
        blacklistedTokenRepository.deleteAllExpiredBefore(LocalDateTime.now());
        auditLogService.log("LOGOUT", "USER", null, null, email, ipAddress);
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        if (isBlank(request.email())) {
            throw new IllegalArgumentException("Email is required");
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        userRepository.findByEmail(email).ifPresent(user -> {
            String rawToken = UUID.randomUUID().toString();

            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setTokenHash(hashToken(rawToken));
            resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_VALID_MINUTES));
            resetToken.setUser(user);
            passwordResetTokenRepository.save(resetToken);

            auditLogService.log("PASSWORD_RESET_REQUESTED", "USER", user.getId(), null, user.getEmail(), null);
            log.info("Password reset token for {}: {}", email, rawToken);
        });
    }

    public void resetPassword(ResetPasswordRequest request) {
        if (isBlank(request.token()) || isBlank(request.newPassword())) {
            throw new IllegalArgumentException("Token and new password are required");
        }
        if (request.newPassword().length() < 8) {
            throw new IllegalArgumentException("Password must contain at least 8 characters");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(hashToken(request.token()))
            .orElseThrow(() -> new IllegalArgumentException("Reset token is invalid or expired"));

        if (Boolean.TRUE.equals(resetToken.getUsed()) || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reset token is invalid or expired");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
        passwordResetTokenRepository.deleteAllExpiredBefore(LocalDateTime.now());
        auditLogService.log("PASSWORD_RESET", "USER", user.getId(), null, user.getEmail(), null);
    }

    public void changePassword(String email, ChangePasswordRequest request, String ipAddress) {
        if (isBlank(request.currentPassword()) || isBlank(request.newPassword())) {
            throw new IllegalArgumentException("Current password and new password are required");
        }
        if (request.newPassword().length() < 8) {
            throw new IllegalArgumentException("Password must contain at least 8 characters");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password must be different from the current password");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        auditLogService.log("PASSWORD_CHANGED", "USER", user.getId(), null, user.getEmail(), ipAddress);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Unable to hash token", exception);
        }
    }

    private void validateRegistration(RegisterRequest request) {
        if (isBlank(request.firstName()) || isBlank(request.lastName())
            || isBlank(request.email()) || isBlank(request.password())) {
            throw new IllegalArgumentException("First name, last name, email, and password are required");
        }
        if (!request.email().contains("@")) {
            throw new IllegalArgumentException("Email is invalid");
        }
        if (request.password().length() < 8) {
            throw new IllegalArgumentException("Password must contain at least 8 characters");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private AuthResponse toAuthResponse(User user, String token) {
        return new AuthResponse(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(), token);
    }
}
