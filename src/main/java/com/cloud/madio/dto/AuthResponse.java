package com.cloud.madio.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private boolean success;
    private String message;
    private Long userId;
    private String email;
    private String role;
    private String redirectUrl; // URL de redirection vers la carte
}
