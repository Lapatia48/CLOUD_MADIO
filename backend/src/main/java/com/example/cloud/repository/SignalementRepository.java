package com.example.cloud.repository;

import com.example.cloud.entity.Signalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Long> {
    
    List<Signalement> findByStatus(String status);
    
    List<Signalement> findByUserId(Long userId);
    
    List<Signalement> findByEntrepriseId(Long entrepriseId);
    
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Signalement s SET s.status = ?2 WHERE s.id = ?1")
    void updateStatus(Long id, String status);
}
