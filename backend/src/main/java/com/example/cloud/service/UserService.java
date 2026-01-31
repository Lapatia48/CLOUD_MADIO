package com.example.cloud.service;

import com.example.cloud.dto.*;
import com.example.cloud.entity.Role;
import com.example.cloud.entity.User;
import com.example.cloud.entity.Session;
import com.example.cloud.repository.RoleRepository;
import com.example.cloud.repository.UserRepository;
import com.example.cloud.repository.SessionRepository;
import com.example.cloud.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        long userCount = userRepository.count();
        String roleLibelle = (userCount == 0) ? "ADMIN" : "USER";

        Role role = roleRepository.findByLibelle(roleLibelle)
                .orElseThrow(() -> new RuntimeException("Role " + roleLibelle + " non trouvé"));

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setRole(role);
        user.setBlocked(false);
        user.setFailedAttempts(0);

        user = userRepository.saveAndFlush(user);

        String roleName = getRoleName(user);
        String token = jwtUtil.generateToken(user.getEmail(), roleName);
        saveSession(user, token);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(roleName)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.isBlocked()) {
            throw new RuntimeException("Compte bloqué. Contactez un administrateur.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            resetFailedAttempts(user);
        } catch (Exception e) {
            incrementFailedAttempts(user);
            throw new RuntimeException("Accès refusé. Veuillez vérifier vos identifiants.");
        }

        String roleName = getRoleName(user);
        String token = jwtUtil.generateToken(user.getEmail(), roleName);
        saveSession(user, token);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(roleName)
                .build();
    }

    public void logout(String token) {
        sessionRepository.deleteByToken(token);
    }

    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (request.getNom() != null) user.setNom(request.getNom());
        if (request.getPrenom() != null) user.setPrenom(request.getPrenom());
        if (request.getEmail() != null) user.setEmail(request.getEmail());

        userRepository.save(user);
        return mapToUserResponse(user);
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return mapToUserResponse(user);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    public void unblockUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setBlocked(false);
        user.setFailedAttempts(0);
        userRepository.save(user);
    }

    public void blockUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setBlocked(true);
        userRepository.save(user);
    }

    private void incrementFailedAttempts(User user) {
        user.setFailedAttempts(user.getFailedAttempts() + 1);
        if (user.getFailedAttempts() >= 3) {
            user.setBlocked(true);
        }
        userRepository.save(user);
    }

    private void resetFailedAttempts(User user) {
        user.setFailedAttempts(0);
        userRepository.save(user);
    }

    private void saveSession(User user, String token) {
        Session session = Session.builder()
                .user(user)
                .token(token)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .isValid(true)
                .build();
        sessionRepository.save(session);
    }

    private String getRoleName(User user) {
        if (user.getRole() != null && user.getRole().getLibelle() != null) {
            return user.getRole().getLibelle();
        }
        return "USER";
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(getRoleName(user))
                .isBlocked(user.isBlocked())
                .build();
    }
}