package com.example.cloud.controller;

import com.example.cloud.dto.SignalementRequest;
import com.example.cloud.dto.SignalementResponse;
import com.example.cloud.dto.StatusUpdateRequest;
import com.example.cloud.service.SignalementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/signalements")
@RequiredArgsConstructor
@Tag(name = "Signalements", description = "APIs de gestion des signalements")
public class SignalementController {
    
    private final SignalementService signalementService;
    
    @PostMapping
    @Operation(summary = "Créer un nouveau signalement")
    public ResponseEntity<SignalementResponse> create(@Valid @RequestBody SignalementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(signalementService.create(request));
    }
    
    @PatchMapping("/{id}/status")
    @Operation(summary = "Modifier le status d'un signalement")
    public ResponseEntity<SignalementResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(signalementService.updateStatus(id, request));
    }
    
    @GetMapping
    @Operation(summary = "Récupérer tous les signalements")
    public ResponseEntity<List<SignalementResponse>> getAll() {
        return ResponseEntity.ok(signalementService.getAll());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un signalement par son ID")
    public ResponseEntity<SignalementResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(signalementService.getById(id));
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Récupérer les signalements par status")
    public ResponseEntity<List<SignalementResponse>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(signalementService.getByStatus(status));
    }
    
    @GetMapping("/user/{userId}")
    @Operation(summary = "Récupérer les signalements d'un utilisateur")
    public ResponseEntity<List<SignalementResponse>> getByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(signalementService.getByUserId(userId));
    }
}
