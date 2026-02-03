package com.example.cloud.controller;

import com.example.cloud.dto.FirebaseSyncRequest;
import com.example.cloud.dto.FirebaseSyncResponse;
import com.example.cloud.service.FirebaseService;
import com.example.cloud.service.SignalementSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/firebase")
@RequiredArgsConstructor
@Tag(name = "Firebase Sync", description = "APIs pour la synchronisation Firebase")
@CrossOrigin(origins = "*")
public class FirebaseController {

    private final FirebaseService firebaseService;
    private final SignalementSyncService signalementSyncService;

    @PostMapping("/sync/user")
    @Operation(summary = "Synchroniser un utilisateur vers Firebase", 
               description = "Crée un compte Firebase Auth et stocke les données dans Firestore")
    public ResponseEntity<FirebaseSyncResponse> syncUser(@RequestBody FirebaseSyncRequest request) {
        FirebaseSyncResponse response = firebaseService.syncUserToFirebase(
                request.getUserId(), 
                request.getPlainPassword()
        );
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/sync/all")
    @Operation(summary = "Synchroniser tous les utilisateurs non synchronisés", 
               description = "Utilise un mot de passe par défaut pour tous les comptes")
    public ResponseEntity<Map<String, Object>> syncAllUsers(
            @RequestParam(defaultValue = "password123") String defaultPassword) {
        Map<String, Object> result = firebaseService.syncAllUsersToFirebase(defaultPassword);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/sync/signalements")
    @Operation(summary = "Synchroniser les signalements Firebase vers PostgreSQL",
               description = "Récupère tous les signalements de Firebase où syncedToPostgres=false et les insère dans PostgreSQL")
    public ResponseEntity<Map<String, Object>> syncSignalements() {
        // Pas besoin de token - on utilise l'API Firestore publique
        Map<String, Object> result = signalementSyncService.syncSignalementsFromFirebase(null);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/status/{userId}")
    @Operation(summary = "Vérifier le statut de synchronisation d'un utilisateur")
    public ResponseEntity<Map<String, Object>> checkSyncStatus(@PathVariable Long userId) {
        // Cette méthode vérifie si l'utilisateur est déjà synchronisé
        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "message", "Utilisez GET /api/users/{id} pour voir le firebase_uid"
        ));
    }
}
