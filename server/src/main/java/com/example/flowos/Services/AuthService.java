package com.example.flowos.Services;

import com.example.flowos.Dto.AuthResponse;
import com.example.flowos.Dto.LoginRequest;
import com.example.flowos.Dto.RegisterRequest;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
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
        return toAuthResponse(savedUser, jwtService.generateToken(savedUser.getEmail()));
    }

    public AuthResponse login(LoginRequest request) {
        if (isBlank(request.email()) || isBlank(request.password())) {
            throw new IllegalArgumentException("Email and password are required");
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!user.getActive() || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        return toAuthResponse(user, jwtService.generateToken(user.getEmail()));
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
