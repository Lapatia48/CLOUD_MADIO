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
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User Management APIs")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get all users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/role/{role}")
    @Operation(summary = "Get all users by role")
    public ResponseEntity<List<UserResponse>> getUsersByRole(@PathVariable String role) {
        return ResponseEntity.ok(userService.getAllUsersByRole(role.toUpperCase()));
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
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user by ID")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        com.example.cloud.dto.UserUpdateRequest request = new com.example.cloud.dto.UserUpdateRequest();
        if (body.containsKey("nom")) request.setNom((String) body.get("nom"));
        if (body.containsKey("prenom")) request.setPrenom((String) body.get("prenom"));
        if (body.containsKey("email")) request.setEmail((String) body.get("email"));
        if (body.containsKey("password")) request.setPassword((String) body.get("password"));
        if (body.containsKey("blocked")) request.setBlocked((Boolean) body.get("blocked"));
        
        // Si on change le rôle
        if (body.containsKey("role")) {
            String roleStr = (String) body.get("role");
            com.example.cloud.entity.User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            com.example.cloud.entity.Role newRole = user.getRole(); // Default keep current
            // Récupérer le rôle depuis la base
            var roleOpt = userRepository.findAll().stream()
                    .map(com.example.cloud.entity.User::getRole)
                    .filter(r -> r != null && roleStr.equals(r.getLibelle()))
                    .findFirst();
            if (roleOpt.isPresent()) {
                user.setRole(roleOpt.get());
                userRepository.save(user);
            }
        }
        
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user by ID")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Utilisateur supprimé"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/unblock")
    @Operation(summary = "Unblock user by ID", 
               description = "Débloque un utilisateur dans PostgreSQL et synchronise vers Firebase (isBlocked=false, failedAttempts=0)")
    public ResponseEntity<Map<String, Object>> unblockUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(userService.unblockUser(user.getEmail()));
    }
    
    @PostMapping("/sync-from-firebase")
    @Operation(summary = "Sync blocked status from Firebase to PostgreSQL", 
               description = "Récupère les statuts isBlocked de tous les users Firebase et met à jour PostgreSQL. Utilisé après que le mobile a bloqué des comptes.")
    public ResponseEntity<Map<String, Object>> syncFromFirebase() {
        return ResponseEntity.ok(userService.syncBlockedStatusFromFirebase());
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole() != null ? user.getRole().getLibelle() : "USER")
                .blocked(user.isBlocked())
                .firebaseUid(user.getFirebaseUid())
                .build();
    }
}