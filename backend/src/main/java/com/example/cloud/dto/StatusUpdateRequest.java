package com.example.cloud.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusUpdateRequest {
    
    @NotBlank(message = "Le status est obligatoire")
    @Pattern(regexp = "NOUVEAU|EN_COURS|TERMINE", message = "Status invalide. Valeurs acceptées: NOUVEAU, EN_COURS, TERMINE")
    private String status;
}
