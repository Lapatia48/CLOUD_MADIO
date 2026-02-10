package com.example.cloud.repository;

import com.example.cloud.entity.PrixMetreCarre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrixMetreCarreRepository extends JpaRepository<PrixMetreCarre, Long> {
}
