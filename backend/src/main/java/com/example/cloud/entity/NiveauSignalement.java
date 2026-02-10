package com.example.cloud.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "niveau_signalement")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NiveauSignalement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_signalement", unique = true, nullable = false)
    private Long idSignalement;

    @Column(nullable = false)
    private Integer niveau; // 1 à 10
}
