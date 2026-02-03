package com.example.cloud.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO pour un signalement provenant de Firebase
 * Respecte les contraintes de la table PostgreSQL signalements:
 * 
 * CREATE TABLE signalements (
 *     id SERIAL PRIMARY KEY,
 *     description TEXT,
 *     latitude DOUBLE PRECISION NOT NULL,
 *     longitude DOUBLE PRECISION NOT NULL,
 *     status VARCHAR(20) DEFAULT 'NOUVEAU',
 *     surface_m2 DECIMAL(10,2),
 *     budget DECIMAL(15,2),
 *     id_entreprise INT REFERENCES entreprises(id),
 *     date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *     user_id INT REFERENCES users(id)
 * );
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
    private BigDecimal surfaceM2;  // DECIMAL(10,2)
    private BigDecimal budget;     // DECIMAL(15,2)
    
    // Référence entreprise
    private Long idEntreprise;  // INT REFERENCES entreprises(id)
    
    // Références utilisateur
    private String userEmail;
    private String firebaseUid;
    
    // Métadonnées
    private String dateSignalement; // TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    private Boolean syncedToPostgres;
    private Long postgresId;
}
