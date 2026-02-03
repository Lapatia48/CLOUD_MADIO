package com.example.cloud.service;

import com.example.cloud.config.FirebaseConfig;
import com.example.cloud.dto.FirebaseSyncResponse;
import com.example.cloud.entity.User;
import com.example.cloud.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Service pour synchroniser les utilisateurs PostgreSQL vers Firebase.
 * Crée un compte dans Firebase Auth et stocke les données dans Firestore.
 */
@Service
@RequiredArgsConstructor
public class FirebaseService {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseService.class);

    private final FirebaseConfig firebaseConfig;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Synchronise un utilisateur vers Firebase.
     * 1. Crée le compte dans Firebase Auth
     * 2. Stocke les données dans Firestore collection "users"
     * 3. Met à jour le firebase_uid dans PostgreSQL
     */
    public FirebaseSyncResponse syncUserToFirebase(Long userId, String plainPassword) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID: " + userId));

            // Vérifier si déjà synchronisé
            if (user.getFirebaseUid() != null && !user.getFirebaseUid().isEmpty()) {
                return FirebaseSyncResponse.builder()
                        .success(true)
                        .message("Utilisateur déjà synchronisé avec Firebase")
                        .firebaseUid(user.getFirebaseUid())
                        .userId(userId)
                        .email(user.getEmail())
                        .build();
            }

            // 1. Créer le compte Firebase Auth
            String firebaseUid = createFirebaseAuthAccount(user.getEmail(), plainPassword);
            logger.info("Compte Firebase Auth créé avec UID: {}", firebaseUid);

            // 2. Stocker dans Firestore
            String firestoreDocId = saveToFirestore(user, firebaseUid, plainPassword);
            logger.info("Document Firestore créé avec ID: {}", firestoreDocId);

            // 3. Mettre à jour PostgreSQL avec le firebase_uid
            user.setFirebaseUid(firebaseUid);
            userRepository.save(user);
            logger.info("Utilisateur PostgreSQL mis à jour avec firebase_uid: {}", firebaseUid);

            return FirebaseSyncResponse.builder()
                    .success(true)
                    .message("Synchronisation réussie avec Firebase")
                    .firebaseUid(firebaseUid)
                    .firestoreDocId(firestoreDocId)
                    .userId(userId)
                    .email(user.getEmail())
                    .build();

        } catch (Exception e) {
            logger.error("Erreur lors de la synchronisation Firebase: ", e);
            return FirebaseSyncResponse.builder()
                    .success(false)
                    .message("Erreur: " + e.getMessage())
                    .userId(userId)
                    .build();
        }
    }

    /**
     * Crée un compte dans Firebase Authentication via l'API REST
     */
    private String createFirebaseAuthAccount(String email, String password) {
        String url = firebaseConfig.getAuthSignUpUrl();

        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        body.put("password", password);
        body.put("returnSecureToken", true);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            
            return jsonNode.get("localId").asText();
        } catch (HttpClientErrorException e) {
            // Gérer le cas où l'email existe déjà
            if (e.getResponseBodyAsString().contains("EMAIL_EXISTS")) {
                logger.warn("Email déjà existant dans Firebase Auth, tentative de récupération...");
                return signInAndGetUid(email, password);
            }
            throw new RuntimeException("Erreur Firebase Auth: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la création du compte Firebase: " + e.getMessage());
        }
    }

    /**
     * Se connecte à Firebase Auth pour récupérer l'UID d'un compte existant
     */
    private String signInAndGetUid(String email, String password) {
        String url = firebaseConfig.getAuthSignInUrl();

        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        body.put("password", password);
        body.put("returnSecureToken", true);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            return jsonNode.get("localId").asText();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la connexion Firebase: " + e.getMessage());
        }
    }

    /**
     * Sauvegarde les données utilisateur dans Firestore collection "users"
     */
    private String saveToFirestore(User user, String firebaseUid, String plainPassword) {
        String url = firebaseConfig.getFirestoreBaseUrl() + "/users";

        // Construire le document Firestore au format API REST
        Map<String, Object> fields = new HashMap<>();
        fields.put("email", createStringValue(user.getEmail()));
        fields.put("password", createStringValue(plainPassword)); // Stocké pour l'app mobile
        fields.put("nom", createStringValue(user.getNom() != null ? user.getNom() : ""));
        fields.put("prenom", createStringValue(user.getPrenom() != null ? user.getPrenom() : ""));
        fields.put("role", createStringValue(user.getRole() != null ? user.getRole().getLibelle() : "USER"));
        fields.put("firebaseUid", createStringValue(firebaseUid));
        fields.put("postgresId", createIntegerValue(user.getId()));
        fields.put("isBlocked", createBooleanValue(user.isBlocked()));

        Map<String, Object> document = new HashMap<>();
        document.put("fields", fields);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(document, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            
            // Extraire l'ID du document depuis le nom complet
            String fullName = jsonNode.get("name").asText();
            return fullName.substring(fullName.lastIndexOf('/') + 1);
        } catch (Exception e) {
            logger.error("Erreur Firestore: ", e);
            throw new RuntimeException("Erreur lors de la sauvegarde dans Firestore: " + e.getMessage());
        }
    }

    // Helpers pour créer les valeurs Firestore
    private Map<String, Object> createStringValue(String value) {
        Map<String, Object> map = new HashMap<>();
        map.put("stringValue", value);
        return map;
    }

    private Map<String, Object> createIntegerValue(Long value) {
        Map<String, Object> map = new HashMap<>();
        map.put("integerValue", String.valueOf(value));
        return map;
    }

    private Map<String, Object> createBooleanValue(boolean value) {
        Map<String, Object> map = new HashMap<>();
        map.put("booleanValue", value);
        return map;
    }

    /**
     * Synchronise tous les utilisateurs non synchronisés vers Firebase
     */
    public Map<String, Object> syncAllUsersToFirebase(String defaultPassword) {
        var users = userRepository.findAll().stream()
                .filter(u -> u.getFirebaseUid() == null || u.getFirebaseUid().isEmpty())
                .toList();

        int success = 0;
        int failed = 0;

        for (User user : users) {
            try {
                FirebaseSyncResponse response = syncUserToFirebase(user.getId(), defaultPassword);
                if (response.isSuccess()) {
                    success++;
                } else {
                    failed++;
                }
            } catch (Exception e) {
                failed++;
                logger.error("Erreur sync user {}: {}", user.getEmail(), e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalProcessed", users.size());
        result.put("success", success);
        result.put("failed", failed);
        return result;
    }
}
