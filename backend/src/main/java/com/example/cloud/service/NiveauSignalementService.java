package com.example.cloud.service;

import com.example.cloud.dto.NiveauSignalementRequest;
import com.example.cloud.dto.NiveauSignalementResponse;
import com.example.cloud.entity.NiveauSignalement;
import com.example.cloud.repository.NiveauSignalementRepository;
import com.example.cloud.repository.SignalementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NiveauSignalementService {

    private final NiveauSignalementRepository niveauSignalementRepository;
    private final SignalementRepository signalementRepository;

    @Transactional
    public NiveauSignalementResponse create(NiveauSignalementRequest request) {
        // Vérifier que le signalement existe
        if (!signalementRepository.existsById(request.getIdSignalement())) {
            throw new RuntimeException("Signalement non trouvé avec l'id: " + request.getIdSignalement());
        }

        // Vérifier qu'un niveau n'existe pas déjà pour ce signalement (contrainte: une seule fois)
        if (niveauSignalementRepository.existsByIdSignalement(request.getIdSignalement())) {
            throw new RuntimeException("Ce signalement a déjà un niveau attribué. Le niveau ne peut être défini qu'une seule fois.");
        }

        NiveauSignalement niveau = NiveauSignalement.builder()
                .idSignalement(request.getIdSignalement())
                .niveau(request.getNiveau())
                .build();

        NiveauSignalement saved = niveauSignalementRepository.save(niveau);
        return mapToResponse(saved);
    }

    public Optional<NiveauSignalementResponse> getBySignalementId(Long idSignalement) {
        return niveauSignalementRepository.findByIdSignalement(idSignalement)
                .map(this::mapToResponse);
    }

    public boolean existsBySignalementId(Long idSignalement) {
        return niveauSignalementRepository.existsByIdSignalement(idSignalement);
    }

    private NiveauSignalementResponse mapToResponse(NiveauSignalement niveau) {
        return NiveauSignalementResponse.builder()
                .id(niveau.getId())
                .idSignalement(niveau.getIdSignalement())
                .niveau(niveau.getNiveau())
                .build();
    }
}
