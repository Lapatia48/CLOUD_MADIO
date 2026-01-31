package com.cloud.madio.repository;

import com.cloud.madio.entity.Signalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, Long> {
    List<Signalement> findByStatus(String status);
    List<Signalement> findByUserId(Long userId);
    List<Signalement> findByEntrepriseId(Long entrepriseId);
}
