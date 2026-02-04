package com.example.cloud.controller;

import com.example.cloud.entity.Configuration;
import com.example.cloud.service.ConfigurationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/configuration")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConfigurationController {

    private final ConfigurationService configurationService;

    @GetMapping
    public ResponseEntity<List<Configuration>> getAll() {
        return ResponseEntity.ok(configurationService.findAll());
    }

    @GetMapping("/{libelle}")
    public ResponseEntity<Configuration> getByLibelle(@PathVariable String libelle) {
        return configurationService.findByLibelle(libelle)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/max-attempts")
    public ResponseEntity<Configuration> getMaxAttempts() {
        return configurationService.findByLibelle("max_attempts")
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/max-attempts")
    public ResponseEntity<Map<String, Object>> updateMaxAttempts(@RequestBody Map<String, Object> body) {
        // Accepter soit "maxAttempts" (int) soit "valeur" (string)
        Integer newValue = null;
        if (body.containsKey("maxAttempts")) {
            newValue = (Integer) body.get("maxAttempts");
        } else if (body.containsKey("valeur")) {
            newValue = Integer.parseInt(body.get("valeur").toString());
        }
        
        if (newValue == null || newValue < 1) {
            return ResponseEntity.badRequest().body(Map.of("error", "maxAttempts doit être >= 1"));
        }
        return ResponseEntity.ok(configurationService.updateMaxAttempts(newValue));
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncToFirebase() {
        return ResponseEntity.ok(configurationService.syncAllConfigToFirebase());
    }
}
