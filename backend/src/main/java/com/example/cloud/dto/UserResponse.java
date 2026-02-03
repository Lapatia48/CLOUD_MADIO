package com.example.cloud.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String nom;
    private String prenom;
    private String role;
    private boolean isBlocked;
    private int failedAttempts;
    private LocalDateTime createdAt;
    private String firebaseUid; // Pour indiquer si synchronisé avec Firebase
}