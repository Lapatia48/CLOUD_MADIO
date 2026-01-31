package com.cloud.madio.controller;

import com.cloud.madio.entity.Signalement;
import com.cloud.madio.service.SignalementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/signalements")
@CrossOrigin(origins = "*")
public class SignalementController {

    @Autowired
    private SignalementService signalementService;

    @GetMapping
    public List<Signalement> findAll() {
        return signalementService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Signalement> findById(@PathVariable Long id) {
        return signalementService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public List<Signalement> findByStatus(@PathVariable String status) {
        return signalementService.findByStatus(status);
    }

    @GetMapping("/user/{userId}")
    public List<Signalement> findByUserId(@PathVariable Long userId) {
        return signalementService.findByUserId(userId);
    }

    @PostMapping
    public Signalement create(@RequestBody Signalement signalement) {
        return signalementService.save(signalement);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Signalement> update(@PathVariable Long id, @RequestBody Signalement signalement) {
        if (!signalementService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        signalement.setId(id);
        return ResponseEntity.ok(signalementService.save(signalement));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Signalement> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(signalementService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        signalementService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
