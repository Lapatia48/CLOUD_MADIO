package com.example.cloud.repository;

import com.example.cloud.entity.NiveauSignalement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NiveauSignalementRepository extends JpaRepository<NiveauSignalement, Long> {

    Optional<NiveauSignalement> findByIdSignalement(Long idSignalement);

    boolean existsByIdSignalement(Long idSignalement);
}
