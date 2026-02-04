package com.example.cloud.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO pour un signalement provenant de Firebase
 * Respecte les contraintes de la table PostgreSQL signalements
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FirebaseSignalementDto {
    
    // Identifiant Firebase
    private String documentId;
    
    // Champs obligatoires (NOT NULL)
    private Double latitude;    // DOUBLE PRECISION NOT NULL
    private Double longitude;   // DOUBLE PRECISION NOT NULL
    
    // Champs optionnels
    private String description; // TEXT
    private String status;      // VARCHAR(20) DEFAULT 'NOUVEAU'
    private Integer avancement; // 0, 50, 100
    private BigDecimal surfaceM2;  // DECIMAL(10,2)
    private BigDecimal budget;     // DECIMAL(15,2)
    
    // Photo
    private String photoBase64; // Photo en base64 depuis mobile
    private String photoUrl;    // URL si stocké dans cloud
    
    // Référence entreprise
    private Long idEntreprise;  // INT REFERENCES entreprises(id)
    private String entrepriseNom; // Nom dénormalisé
    
    // Références utilisateur
    private String userEmail;
    private String firebaseUid;
    
    // Métadonnées
    private String dateSignalement; // TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    private Boolean syncedToPostgres;
    private Long postgresId;
}
