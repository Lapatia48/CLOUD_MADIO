package com.example.cloud.service;

import com.example.cloud.dto.PrixMetreCarreResponse;
import com.example.cloud.entity.PrixMetreCarre;
import com.example.cloud.repository.PrixMetreCarreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrixMetreCarreService {

    private final PrixMetreCarreRepository prixMetreCarreRepository;

    public List<PrixMetreCarreResponse> getAll() {
        return prixMetreCarreRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public PrixMetreCarreResponse getFirst() {
        List<PrixMetreCarre> all = prixMetreCarreRepository.findAll();
        if (all.isEmpty()) {
            throw new RuntimeException("Aucun prix au mètre carré configuré");
        }
        return mapToResponse(all.get(0));
    }

    private PrixMetreCarreResponse mapToResponse(PrixMetreCarre prix) {
        return PrixMetreCarreResponse.builder()
                .id(prix.getId())
                .prix(prix.getPrix())
                .build();
    }
}
