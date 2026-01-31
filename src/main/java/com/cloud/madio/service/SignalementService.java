package com.cloud.madio.service;

import com.cloud.madio.entity.Signalement;
import com.cloud.madio.repository.SignalementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class SignalementService {
    
    @Autowired
    private SignalementRepository signalementRepository;

    public List<Signalement> findAll() {
        return signalementRepository.findAll();
    }

    public Optional<Signalement> findById(Long id) {
        return signalementRepository.findById(id);
    }

    public List<Signalement> findByStatus(String status) {
        return signalementRepository.findByStatus(status);
    }

    public List<Signalement> findByUserId(Long userId) {
        return signalementRepository.findByUserId(userId);
    }

    public Signalement save(Signalement signalement) {
        return signalementRepository.save(signalement);
    }

    public Signalement updateStatus(Long id, String status) {
        Signalement signalement = signalementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Signalement non trouvé"));
        signalement.setStatus(status);
        return signalementRepository.save(signalement);
    }

    public void deleteById(Long id) {
        signalementRepository.deleteById(id);
    }
}
