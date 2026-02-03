package com.example.cloud.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FirebaseSyncResponse {
    private boolean success;
    private String message;
    private String firebaseUid;
    private String firestoreDocId;
    private Long userId;
    private String email;
}
