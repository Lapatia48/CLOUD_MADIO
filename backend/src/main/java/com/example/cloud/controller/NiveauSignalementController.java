package com.example.cloud.controller;

import com.example.cloud.dto.NiveauSignalementRequest;
import com.example.cloud.dto.NiveauSignalementResponse;
import com.example.cloud.service.NiveauSignalementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/niveau-signalement")
@RequiredArgsConstructor
@Tag(name = "Niveau Signalement", description = "APIs de gestion des niveaux de signalements")
public class NiveauSignalementController {

    private final NiveauSignalementService niveauSignalementService;

    @PostMapping
    @Operation(summary = "Attribuer un niveau à un signalement (une seule fois)")
    public ResponseEntity<?> create(@Valid @RequestBody NiveauSignalementRequest request) {
        try {
            NiveauSignalementResponse response = niveauSignalementService.create(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/signalement/{idSignalement}")
    @Operation(summary = "Récupérer le niveau d'un signalement")
    public ResponseEntity<?> getBySignalementId(@PathVariable Long idSignalement) {
        Optional<NiveauSignalementResponse> niveau = niveauSignalementService.getBySignalementId(idSignalement);
        if (niveau.isPresent()) {
            return ResponseEntity.ok(niveau.get());
        }
        return ResponseEntity.ok(null);
    }

    @GetMapping("/signalement/{idSignalement}/exists")
    @Operation(summary = "Vérifier si un signalement a déjà un niveau")
    public ResponseEntity<Boolean> existsBySignalementId(@PathVariable Long idSignalement) {
        return ResponseEntity.ok(niveauSignalementService.existsBySignalementId(idSignalement));
    }
}
