package com.example.cloud.repository;

import com.example.cloud.entity.Entreprise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EntrepriseRepository extends JpaRepository<Entreprise, Long> {
    
    Optional<Entreprise> findByNom(String nom);
    
    boolean existsByNom(String nom);
}
