package com.example.cloud.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignalementResponse {
    
    private Long id;
    private String description;
    private Double latitude;
    private Double longitude;
    private String status;
    private Integer avancement; // 0, 50, 100
    private BigDecimal surfaceM2;
    private BigDecimal budget;
    private Long entrepriseId;
    private String entrepriseNom;
    private LocalDateTime dateSignalement;
    private Long userId;
    private String userEmail;
    private String photoBase64; // Photo en base64
    private String photoUrl; // URL si stocké dans le cloud
}
