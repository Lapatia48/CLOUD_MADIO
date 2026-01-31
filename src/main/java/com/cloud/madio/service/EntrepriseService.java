package com.cloud.madio.service;

import com.cloud.madio.entity.Entreprise;
import com.cloud.madio.repository.EntrepriseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class EntrepriseService {
    
    @Autowired
    private EntrepriseRepository entrepriseRepository;

    public List<Entreprise> findAll() {
        return entrepriseRepository.findAll();
    }

    public Optional<Entreprise> findById(Long id) {
        return entrepriseRepository.findById(id);
    }

    public Entreprise save(Entreprise entreprise) {
        return entrepriseRepository.save(entreprise);
    }

    public void deleteById(Long id) {
        entrepriseRepository.deleteById(id);
    }
}
