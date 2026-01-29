package com.example.cloud.controller;

import com.example.cloud.dto.EntrepriseRequest;
import com.example.cloud.dto.EntrepriseResponse;
import com.example.cloud.service.EntrepriseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entreprises")
@RequiredArgsConstructor
@Tag(name = "Entreprises", description = "APIs de gestion des entreprises")
public class EntrepriseController {
    
    private final EntrepriseService entrepriseService;
    
    @PostMapping
    @Operation(summary = "Créer une nouvelle entreprise")
    public ResponseEntity<EntrepriseResponse> create(@Valid @RequestBody EntrepriseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(entrepriseService.create(request));
    }
    
    @GetMapping
    @Operation(summary = "Récupérer toutes les entreprises")
    public ResponseEntity<List<EntrepriseResponse>> getAll() {
        return ResponseEntity.ok(entrepriseService.getAll());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une entreprise par son ID")
    public ResponseEntity<EntrepriseResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(entrepriseService.getById(id));
    }
}
