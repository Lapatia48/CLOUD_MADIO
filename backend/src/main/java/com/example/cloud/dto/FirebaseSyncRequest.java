package com.example.cloud.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FirebaseSyncRequest {
    private Long userId;
    private String plainPassword; // Mot de passe en clair pour créer le compte Firebase
}
