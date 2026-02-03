package com.example.cloud.service;

import com.example.cloud.dto.SignalementRequest;
import com.example.cloud.dto.SignalementResponse;
import com.example.cloud.dto.StatusUpdateRequest;
import com.example.cloud.entity.Entreprise;
import com.example.cloud.entity.Signalement;
import com.example.cloud.entity.User;
import com.example.cloud.repository.EntrepriseRepository;
import com.example.cloud.repository.SignalementRepository;
import com.example.cloud.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SignalementService {
    
    private final SignalementRepository signalementRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public SignalementResponse create(SignalementRequest request) {
        Signalement signalement = Signalement.builder()
                .description(request.getDescription())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .surfaceM2(request.getSurfaceM2())
                .budget(request.getBudget())
                .build();
        
        // Associer l'entreprise si fournie
        if (request.getEntrepriseId() != null) {
            Entreprise entreprise = entrepriseRepository.findById(request.getEntrepriseId())
                    .orElseThrow(() -> new RuntimeException("Entreprise non trouvée avec l'id: " + request.getEntrepriseId()));
            signalement.setEntreprise(entreprise);
        }
        
        // Associer l'utilisateur si fourni
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'id: " + request.getUserId()));
            signalement.setUser(user);
        }
        
        Signalement saved = signalementRepository.save(signalement);
        return mapToResponse(saved);
    }
    
    @Transactional
    public SignalementResponse updateStatus(Long id, StatusUpdateRequest request) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Signalement non trouvé avec l'id: " + id));
        
        signalement.setStatus(request.getStatus());
        Signalement updated = signalementRepository.save(signalement);
        return mapToResponse(updated);
    }
    
    @Transactional
    public SignalementResponse update(Long id, SignalementRequest request) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Signalement non trouvé avec l'id: " + id));
        
        // Mettre à jour les champs
        if (request.getDescription() != null) {
            signalement.setDescription(request.getDescription());
        }
        if (request.getLatitude() != null) {
            signalement.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            signalement.setLongitude(request.getLongitude());
        }
        if (request.getSurfaceM2() != null) {
            signalement.setSurfaceM2(request.getSurfaceM2());
        }
        if (request.getBudget() != null) {
            signalement.setBudget(request.getBudget());
        }
        if (request.getStatus() != null) {
            signalement.setStatus(request.getStatus());
        }
        
        // Mettre à jour l'entreprise si fournie
        if (request.getEntrepriseId() != null) {
            Entreprise entreprise = entrepriseRepository.findById(request.getEntrepriseId())
                    .orElseThrow(() -> new RuntimeException("Entreprise non trouvée avec l'id: " + request.getEntrepriseId()));
            signalement.setEntreprise(entreprise);
        }
        
        Signalement updated = signalementRepository.save(signalement);
        return mapToResponse(updated);
    }
    
    public List<SignalementResponse> getAll() {
        return signalementRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public SignalementResponse getById(Long id) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Signalement non trouvé avec l'id: " + id));
        return mapToResponse(signalement);
    }
    
    public List<SignalementResponse> getByStatus(String status) {
        return signalementRepository.findByStatus(status)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<SignalementResponse> getByUserId(Long userId) {
        return signalementRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    private SignalementResponse mapToResponse(Signalement signalement) {
        return SignalementResponse.builder()
                .id(signalement.getId())
                .description(signalement.getDescription())
                .latitude(signalement.getLatitude())
                .longitude(signalement.getLongitude())
                .status(signalement.getStatus())
                .surfaceM2(signalement.getSurfaceM2())
                .budget(signalement.getBudget())
                .entrepriseId(signalement.getEntreprise() != null ? signalement.getEntreprise().getId() : null)
                .entrepriseNom(signalement.getEntreprise() != null ? signalement.getEntreprise().getNom() : null)
                .dateSignalement(signalement.getDateSignalement())
                .userId(signalement.getUser() != null ? signalement.getUser().getId() : null)
                .userEmail(signalement.getUser() != null ? signalement.getUser().getEmail() : null)
                .build();
    }
}
