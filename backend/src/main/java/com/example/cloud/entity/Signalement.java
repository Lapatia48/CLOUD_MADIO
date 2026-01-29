package com.example.cloud.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "signalements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Signalement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private Double latitude;
    
    @Column(nullable = false)
    private Double longitude;
    
    @Column(length = 20)
    @Builder.Default
    private String status = "NOUVEAU"; // 'NOUVEAU', 'EN_COURS', 'TERMINE'
    
    @Column(name = "surface_m2", precision = 10, scale = 2)
    private BigDecimal surfaceM2;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal budget;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_entreprise")
    private Entreprise entreprise;
    
    @Column(name = "date_signalement", updatable = false)
    @Builder.Default
    private LocalDateTime dateSignalement = LocalDateTime.now();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
