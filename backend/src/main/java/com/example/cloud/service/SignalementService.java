package com.example.cloud.service;

import com.example.cloud.dto.SignalementRequest;
import com.example.cloud.dto.SignalementResponse;
import com.example.cloud.dto.StatusUpdateRequest;
import com.example.cloud.entity.Entreprise;
import com.example.cloud.entity.HistoriqueModifSignalement;
import com.example.cloud.entity.Notification;
import com.example.cloud.entity.Signalement;
import com.example.cloud.entity.User;
import com.example.cloud.repository.EntrepriseRepository;
import com.example.cloud.repository.HistoriqueModifSignalementRepository;
import com.example.cloud.repository.NotificationRepository;
import com.example.cloud.repository.SignalementRepository;
import com.example.cloud.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SignalementService {
    
    private final SignalementRepository signalementRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final HistoriqueModifSignalementRepository historiqueRepository;
    
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
        return updateStatus(id, request, null);
    }
    
    @Transactional
    public SignalementResponse updateStatus(Long id, StatusUpdateRequest request, Long adminUserId) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Signalement non trouvé avec l'id: " + id));
        
        String ancienStatus = signalement.getStatus();
        String nouveauStatus = request.getStatus();
        
        // Si le status change
        if (!ancienStatus.equals(nouveauStatus)) {
            signalement.setStatus(nouveauStatus);
            signalement.setDateModification(LocalDateTime.now());
            
            // Créer l'historique
            User adminUser = adminUserId != null ? userRepository.findById(adminUserId).orElse(null) : null;
            HistoriqueModifSignalement historique = HistoriqueModifSignalement.builder()
                    .user(adminUser)
                    .signalement(signalement)
                    .statusAncien(ancienStatus)
                    .statusNouveau(nouveauStatus)
                    .build();
            historiqueRepository.save(historique);
            
            // Créer notification pour l'utilisateur qui a créé le signalement
            if (signalement.getUser() != null) {
                String statusLabel = getStatusLabel(nouveauStatus);
                Notification notification = Notification.builder()
                        .user(signalement.getUser())
                        .signalement(signalement)
                        .description("Votre signalement #" + signalement.getId() + " a été mis à jour. Nouveau statut : " + statusLabel)
                        .build();
                notificationRepository.save(notification);
            }
        }
        
        Signalement updated = signalementRepository.save(signalement);
        return mapToResponse(updated);
    }
    
    private String getStatusLabel(String status) {
        switch (status) {
            case "NOUVEAU": return "Nouveau (0%)";
            case "EN_COURS": return "En cours (50%)";
            case "TERMINE": return "Terminé (100%)";
            default: return status;
        }
    }
    
    @Transactional
    public SignalementResponse update(Long id, SignalementRequest request) {
        return update(id, request, null);
    }
    
    @Transactional
    public SignalementResponse update(Long id, SignalementRequest request, Long adminUserId) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Signalement non trouvé avec l'id: " + id));
        
        String ancienStatus = signalement.getStatus();
        boolean statusChanged = false;
        
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
        if (request.getStatus() != null && !request.getStatus().equals(ancienStatus)) {
            signalement.setStatus(request.getStatus());
            statusChanged = true;
        }
        
        // Mettre à jour l'entreprise si fournie
        if (request.getEntrepriseId() != null) {
            Entreprise entreprise = entrepriseRepository.findById(request.getEntrepriseId())
                    .orElseThrow(() -> new RuntimeException("Entreprise non trouvée avec l'id: " + request.getEntrepriseId()));
            signalement.setEntreprise(entreprise);
        }
        
        // Si le status a changé, créer historique et notification
        if (statusChanged) {
            signalement.setDateModification(LocalDateTime.now());
            
            // Créer l'historique
            User adminUser = adminUserId != null ? userRepository.findById(adminUserId).orElse(null) : null;
            HistoriqueModifSignalement historique = HistoriqueModifSignalement.builder()
                    .user(adminUser)
                    .signalement(signalement)
                    .statusAncien(ancienStatus)
                    .statusNouveau(request.getStatus())
                    .build();
            historiqueRepository.save(historique);
            
            // Créer notification pour l'utilisateur qui a créé le signalement
            if (signalement.getUser() != null) {
                String statusLabel = getStatusLabel(request.getStatus());
                Notification notification = Notification.builder()
                        .user(signalement.getUser())
                        .signalement(signalement)
                        .description("Votre signalement #" + signalement.getId() + " a été mis à jour. Nouveau statut : " + statusLabel)
                        .build();
                notificationRepository.save(notification);
            }
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
                .dateModification(signalement.getDateModification())
                .userId(signalement.getUser() != null ? signalement.getUser().getId() : null)
                .userEmail(signalement.getUser() != null ? signalement.getUser().getEmail() : null)
                .build();
    }
}
