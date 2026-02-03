package com.example.cloud.controller;

import com.example.cloud.dto.UserResponse;
import com.example.cloud.entity.User;
import com.example.cloud.repository.UserRepository;
import com.example.cloud.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User Management APIs")
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get all users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/blocked")
    @Operation(summary = "Get all blocked users")
    public ResponseEntity<List<UserResponse>> getBlockedUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .filter(User::isBlocked)
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(this::mapToUserResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/unblock")
    @Operation(summary = "Unblock user by ID")
    public ResponseEntity<Void> unblockUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userService.unblockUser(user.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/block")
    @Operation(summary = "Block user by ID")
    public ResponseEntity<Void> blockUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userService.blockUser(user.getEmail());
        return ResponseEntity.ok().build();
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole() != null ? user.getRole().getLibelle() : "USER")
                .isBlocked(user.isBlocked())
                .failedAttempts(user.getFailedAttempts())
                .build();
    }
}