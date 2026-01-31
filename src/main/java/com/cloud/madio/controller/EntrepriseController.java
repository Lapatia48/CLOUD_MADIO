package com.cloud.madio.controller;

import com.cloud.madio.entity.Entreprise;
import com.cloud.madio.service.EntrepriseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/entreprises")
@CrossOrigin(origins = "*")
public class EntrepriseController {

    @Autowired
    private EntrepriseService entrepriseService;

    @GetMapping
    public List<Entreprise> findAll() {
        return entrepriseService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Entreprise> findById(@PathVariable Long id) {
        return entrepriseService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Entreprise create(@RequestBody Entreprise entreprise) {
        return entrepriseService.save(entreprise);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Entreprise> update(@PathVariable Long id, @RequestBody Entreprise entreprise) {
        if (!entrepriseService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        entreprise.setId(id);
        return ResponseEntity.ok(entrepriseService.save(entreprise));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        entrepriseService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
