package com.example.cloud.controller;

import com.example.cloud.dto.UserResponse;
import com.example.cloud.entity.User;
import com.example.cloud.repository.UserRepository;
import com.example.cloud.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(this::mapToUserResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/blocked")
    public ResponseEntity<List<UserResponse>> getBlockedUsers() {
        List<UserResponse> blockedUsers = userRepository.findByIsBlockedTrue().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(blockedUsers);
    }

    @PutMapping("/{id}/unblock")
    public ResponseEntity<Void> unblockUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        userService.unblockUser(user.getEmail());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/block")
    public ResponseEntity<Void> blockUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
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
                .build();
    }
}