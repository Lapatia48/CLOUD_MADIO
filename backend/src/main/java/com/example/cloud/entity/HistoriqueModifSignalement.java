package com.example.cloud.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "historique_modif_signalement")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoriqueModifSignalement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_user")
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_signalement")
    private Signalement signalement;
    
    @Column(name = "date_modif")
    @Builder.Default
    private LocalDateTime dateModif = LocalDateTime.now();
    
    @Column(name = "status_ancien", length = 20)
    private String statusAncien;
    
    @Column(name = "status_nouveau", length = 20)
    private String statusNouveau;
}
