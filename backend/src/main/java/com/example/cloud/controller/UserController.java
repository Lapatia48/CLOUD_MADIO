package com.example.cloud.controller;

import com.example.cloud.dto.UserResponse;  // ✅ Utilisez le DTO existant
import com.example.cloud.repository.UserRepository;
import com.example.cloud.service.UserService;  // ✅ Utilisez le service
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;  // ✅ Injectez le service au lieu du repository
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();  // ✅ Utilise déjà le DTO
        return ResponseEntity.ok(users);
    }

    @GetMapping("/blocked")
    public ResponseEntity<List<UserResponse>> getBlockedUsers() {
        List<UserResponse> blockedUsers = userRepository.findByIsBlockedTrue()
                .stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .nom(user.getNom())
                        .prenom(user.getPrenom())
                        .role(user.getRole())
                        .isBlocked(user.isBlocked())
                        .createdAt(user.getCreatedAt())
                        .build())
                .toList();
        return ResponseEntity.ok(blockedUsers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/unblock")
    public ResponseEntity<?> unblockUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setBlocked(false);
                    user.setFailedAttempts(0);
                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Utilisateur débloqué avec succès"
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/block")
    public ResponseEntity<?> blockUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setBlocked(true);
                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Utilisateur bloqué avec succès"
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}