package com.example.cloud.controller;

import com.example.cloud.dto.PrixMetreCarreResponse;
import com.example.cloud.service.PrixMetreCarreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prix-metre-carre")
@RequiredArgsConstructor
@Tag(name = "Prix Mètre Carré", description = "APIs pour le prix au mètre carré")
public class PrixMetreCarreController {

    private final PrixMetreCarreService prixMetreCarreService;

    @GetMapping
    @Operation(summary = "Récupérer tous les prix au mètre carré")
    public ResponseEntity<List<PrixMetreCarreResponse>> getAll() {
        return ResponseEntity.ok(prixMetreCarreService.getAll());
    }

    @GetMapping("/current")
    @Operation(summary = "Récupérer le prix au mètre carré actuel")
    public ResponseEntity<PrixMetreCarreResponse> getCurrent() {
        return ResponseEntity.ok(prixMetreCarreService.getFirst());
    }

    @PutMapping("/current")
    @Operation(summary = "Mettre à jour le prix au mètre carré")
    public ResponseEntity<PrixMetreCarreResponse> updateCurrent(@RequestBody java.util.Map<String, Object> body) {
        java.math.BigDecimal newPrix = new java.math.BigDecimal(body.get("prix").toString());
        return ResponseEntity.ok(prixMetreCarreService.updateFirst(newPrix));
    }
}
