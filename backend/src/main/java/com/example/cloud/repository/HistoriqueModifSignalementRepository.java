package com.example.cloud.repository;

import com.example.cloud.entity.HistoriqueModifSignalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoriqueModifSignalementRepository extends JpaRepository<HistoriqueModifSignalement, Long> {
    
    List<HistoriqueModifSignalement> findBySignalementIdOrderByDateModifDesc(Long signalementId);
    
    List<HistoriqueModifSignalement> findByUserIdOrderByDateModifDesc(Long userId);
}
