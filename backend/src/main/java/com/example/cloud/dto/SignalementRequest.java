package com.example.cloud.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignalementRequest {
    
    private String description;
    
    @NotNull(message = "La latitude est obligatoire")
    private Double latitude;
    
    @NotNull(message = "La longitude est obligatoire")
    private Double longitude;
    
    private BigDecimal surfaceM2;
    
    private BigDecimal budget;
    
    private Long entrepriseId;
    
    private Long idEntreprise; // Alias pour entrepriseId (utilisé par le frontend)
    
    private Long userId;
    
    private String status;
    
    private Integer avancement; // 0, 50, ou 100
    
    private String photoBase64; // Photo en base64
    
    // Helper pour obtenir l'ID entreprise (supporte les deux noms)
    public Long getEffectiveEntrepriseId() {
        return entrepriseId != null ? entrepriseId : idEntreprise;
    }
}
