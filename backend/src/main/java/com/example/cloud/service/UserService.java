package com.example.cloud.service;

import com.example.cloud.dto.*;
import com.example.cloud.entity.Session;
import com.example.cloud.entity.User;
import com.example.cloud.repository.SessionRepository;
import com.example.cloud.repository.UserRepository;
import com.example.cloud.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final LoginAttemptService loginAttemptService;
    
    @Value("${jwt.expiration}")
    private Long jwtExpiration;
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .role("USER")
                .build();
        
        User savedUser = userRepository.save(user);
        
        // Generate token and create session
        String token = jwtUtil.generateToken(user.getEmail());
        createSession(savedUser, token);
        
        return AuthResponse.builder()
                .token(token)
                .user(mapToUserResponse(savedUser))
                .build();
    }
    
    public AuthResponse login(LoginRequest request) {
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());
        
        if (userOptional.isEmpty()) {
            throw new RuntimeException("Invalid credentials");
        }
        
        User user = userOptional.get();
        
        // Check if user is blocked
        if (user.isBlocked()) {
            throw new RuntimeException("Account is blocked. Please contact administrator");
        }
        
        // Check password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            // Call separate service to ensure new transaction commits
            loginAttemptService.handleFailedLogin(user.getEmail());
            throw new RuntimeException("Invalid credentials");
        }
        
        // Reset failed attempts on successful login
        loginAttemptService.resetFailedAttempts(user.getEmail());
        
        // Generate token and create session
        return createLoginSession(user);
    }
    
    @Transactional
    public AuthResponse createLoginSession(User user) {
        String token = jwtUtil.generateToken(user.getEmail());
        createSession(user, token);
        
        return AuthResponse.builder()
                .token(token)
                .user(mapToUserResponse(user))
                .build();
    }
    
    @Transactional
    public UserResponse updateUser(Long userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (request.getNom() != null) {
            user.setNom(request.getNom());
        }
        if (request.getPrenom() != null) {
            user.setPrenom(request.getPrenom());
        }
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(request.getEmail());
        }
        
        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }
    
    @Transactional
    public void resetPassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
    
    @Transactional
    public void logout(String token) {
        sessionRepository.invalidateSession(token);
    }
    
    @Transactional
    public void unblockUser(String email) {
        userRepository.unblockUser(email);
    }
    
    @Transactional
    public void blockUser(String email) {
        userRepository.blockUser(email);
    }
    
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToUserResponse(user);
    }
    
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .toList();
    }
    
    private void createSession(User user, String token) {
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(jwtExpiration / 1000);
        
        Session session = Session.builder()
                .user(user)
                .token(token)
                .expiresAt(expiresAt)
                .isValid(true)
                .build();
        
        sessionRepository.save(session);
    }
    
    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole())
                .isBlocked(user.isBlocked())
                .createdAt(user.getCreatedAt())
                .build();
    }
}