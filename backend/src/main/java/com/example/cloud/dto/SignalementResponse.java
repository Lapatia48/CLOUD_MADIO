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
    private BigDecimal surfaceM2;
    private BigDecimal budget;
    private Long entrepriseId;
    private String entrepriseNom;
    private LocalDateTime dateSignalement;
    private LocalDateTime dateModification;
    private Long userId;
    private String userEmail;
}
