package com.example.cloud.service;

import com.example.cloud.dto.EntrepriseRequest;
import com.example.cloud.dto.EntrepriseResponse;
import com.example.cloud.entity.Entreprise;
import com.example.cloud.repository.EntrepriseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EntrepriseService {
    
    private final EntrepriseRepository entrepriseRepository;
    
    @Transactional
    public EntrepriseResponse create(EntrepriseRequest request) {
        Entreprise entreprise = Entreprise.builder()
                .nom(request.getNom())
                .adresse(request.getAdresse())
                .telephone(request.getTelephone())
                .email(request.getEmail())
                .build();
        
        Entreprise saved = entrepriseRepository.save(entreprise);
        return mapToResponse(saved);
    }
    
    public List<EntrepriseResponse> getAll() {
        return entrepriseRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public EntrepriseResponse getById(Long id) {
        Entreprise entreprise = entrepriseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Entreprise non trouvée avec l'id: " + id));
        return mapToResponse(entreprise);
    }
    
    private EntrepriseResponse mapToResponse(Entreprise entreprise) {
        return EntrepriseResponse.builder()
                .id(entreprise.getId())
                .nom(entreprise.getNom())
                .adresse(entreprise.getAdresse())
                .telephone(entreprise.getTelephone())
                .email(entreprise.getEmail())
                .build();
    }
}
