package com.example.cloud.service;

import com.example.cloud.config.FirebaseConfig;
import com.example.cloud.dto.FirebaseSignalementDto;
import com.example.cloud.entity.Entreprise;
import com.example.cloud.entity.Signalement;
import com.example.cloud.entity.User;
import com.example.cloud.repository.EntrepriseRepository;
import com.example.cloud.repository.SignalementRepository;
import com.example.cloud.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Service pour synchroniser les signalements depuis Firebase Firestore vers PostgreSQL.
 * 
 * Flux: Mobile (Firebase) → Web (PostgreSQL)
 * 1. Récupère tous les signalements de Firebase
 * 2. Filtre ceux où syncedToPostgres = false
 * 3. Vérifie s'ils n'existent pas déjà dans PostgreSQL (par coordonnées)
 * 4. Crée les nouveaux signalements dans PostgreSQL
 * 5. Marque les signalements comme synchronisés dans Firebase
 */
@Service
@RequiredArgsConstructor
public class SignalementSyncService {

    private static final Logger logger = LoggerFactory.getLogger(SignalementSyncService.class);

    private final FirebaseConfig firebaseConfig;
    private final SignalementRepository signalementRepository;
    private final UserRepository userRepository;
    private final EntrepriseRepository entrepriseRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Récupère tous les signalements depuis Firebase et synchronise vers PostgreSQL
     */
    public Map<String, Object> syncSignalementsFromFirebase(String firebaseToken) {
        logger.info("=== Début synchronisation Firebase → PostgreSQL ===");
        
        // 1. Récupérer TOUS les signalements de Firebase (API publique)
        List<FirebaseSignalementDto> allSignalements = fetchAllSignalementsFromFirebase();
        logger.info("Total signalements trouvés dans Firebase: {}", allSignalements.size());
        
        // 2. Filtrer ceux qui ne sont pas encore synchronisés
        List<FirebaseSignalementDto> unsyncedSignalements = allSignalements.stream()
            .filter(s -> s.getSyncedToPostgres() == null || !s.getSyncedToPostgres())
            .toList();
        logger.info("Signalements non synchronisés: {}", unsyncedSignalements.size());
        
        int success = 0;
        int failed = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();
        List<Long> syncedIds = new ArrayList<>();

        for (FirebaseSignalementDto dto : unsyncedSignalements) {
            try {
                logger.info("Traitement signalement Firebase: {} - {}", dto.getDocumentId(), dto.getDescription());
                
                // Valider les contraintes NOT NULL
                if (dto.getLatitude() == null || dto.getLongitude() == null) {
                    errors.add("Signalement " + dto.getDocumentId() + ": latitude/longitude manquante");
                    failed++;
                    continue;
                }

                // Vérifier si ce signalement existe déjà (par coordonnées exactes)
                List<Signalement> existing = signalementRepository.findByLatitudeAndLongitude(
                    dto.getLatitude(), dto.getLongitude()
                );
                
                if (!existing.isEmpty()) {
                    logger.info("Signalement {} déjà existant (coordonnées), skip", dto.getDocumentId());
                    // Marquer comme sync même s'il existe
                    markAsSyncedInFirebase(dto.getDocumentId(), existing.get(0).getId());
                    skipped++;
                    continue;
                }

                // Trouver l'utilisateur par email ou firebaseUid
                User user = findUserByEmailOrFirebaseUid(dto.getUserEmail(), dto.getFirebaseUid());
                
                // Trouver l'entreprise si idEntreprise est fourni
                Entreprise entreprise = null;
                if (dto.getIdEntreprise() != null) {
                    entreprise = entrepriseRepository.findById(dto.getIdEntreprise()).orElse(null);
                    logger.info("Entreprise: {}", entreprise != null ? entreprise.getNom() : "null");
                }
                
                // Créer le signalement dans PostgreSQL
                Signalement signalement = new Signalement();
                signalement.setDescription(dto.getDescription());
                signalement.setLatitude(dto.getLatitude());
                signalement.setLongitude(dto.getLongitude());
                signalement.setStatus(dto.getStatus() != null ? dto.getStatus() : "NOUVEAU");
                signalement.setSurfaceM2(dto.getSurfaceM2());
                signalement.setBudget(dto.getBudget());
                signalement.setEntreprise(entreprise);
                signalement.setUser(user);
                
                // Parser la date
                if (dto.getDateSignalement() != null) {
                    try {
                        LocalDateTime dateTime = LocalDateTime.parse(
                            dto.getDateSignalement().replace("Z", ""),
                            DateTimeFormatter.ISO_LOCAL_DATE_TIME
                        );
                        signalement.setDateSignalement(dateTime);
                    } catch (Exception e) {
                        signalement.setDateSignalement(LocalDateTime.now());
                    }
                } else {
                    signalement.setDateSignalement(LocalDateTime.now());
                }

                // Sauvegarder dans PostgreSQL
                signalement = signalementRepository.save(signalement);
                logger.info("✅ Signalement créé dans PostgreSQL ID: {}", signalement.getId());

                // Marquer comme synchronisé dans Firebase
                markAsSyncedInFirebase(dto.getDocumentId(), signalement.getId());
                
                syncedIds.add(signalement.getId());
                success++;
                
            } catch (Exception e) {
                logger.error("❌ Erreur sync signalement {}: {}", dto.getDocumentId(), e.getMessage(), e);
                errors.add("Signalement " + dto.getDocumentId() + ": " + e.getMessage());
                failed++;
            }
        }

        logger.info("=== Fin sync: {} succès, {} échecs, {} ignorés ===", success, failed, skipped);

        Map<String, Object> result = new HashMap<>();
        result.put("totalFound", allSignalements.size());
        result.put("unsynced", unsyncedSignalements.size());
        result.put("success", success);
        result.put("failed", failed);
        result.put("skipped", skipped);
        result.put("syncedIds", syncedIds);
        result.put("errors", errors);
        return result;
    }

    /**
     * Récupère TOUS les signalements depuis Firestore via API REST publique (sans auth)
     */
    private List<FirebaseSignalementDto> fetchAllSignalementsFromFirebase() {
        String url = firebaseConfig.getFirestoreBaseUrl() + "/signalements";
        logger.info("Fetching from: {}", url);

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            logger.info("Firebase response status: {}", response.getStatusCode());
            return parseSignalementsListResponse(response.getBody());
        } catch (Exception e) {
            logger.error("Erreur fetch Firebase: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Parse la réponse de liste de documents Firestore
     */
    private List<FirebaseSignalementDto> parseSignalementsListResponse(String responseBody) {
        List<FirebaseSignalementDto> result = new ArrayList<>();
        
        if (responseBody == null || responseBody.isEmpty()) {
            logger.warn("Response body vide");
            return result;
        }
        
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode documents = root.get("documents");
            
            if (documents != null && documents.isArray()) {
                logger.info("Nombre de documents Firebase: {}", documents.size());
                
                for (JsonNode document : documents) {
                    try {
                        FirebaseSignalementDto dto = parseDocument(document);
                        if (dto != null) {
                            result.add(dto);
                            logger.info("Parsé: {} sync={}", dto.getDocumentId(), dto.getSyncedToPostgres());
                        }
                    } catch (Exception e) {
                        logger.error("Erreur parsing doc: {}", e.getMessage());
                    }
                }
            } else {
                logger.warn("Pas de 'documents' dans la réponse Firebase");
            }
        } catch (Exception e) {
            logger.error("Erreur parsing Firebase: {}", e.getMessage(), e);
        }
        
        return result;
    }

    /**
     * Parse un document Firestore en DTO
     */
    private FirebaseSignalementDto parseDocument(JsonNode document) {
        JsonNode nameNode = document.get("name");
        if (nameNode == null) return null;
        
        String fullName = nameNode.asText();
        String documentId = fullName.substring(fullName.lastIndexOf('/') + 1);
        
        JsonNode fields = document.get("fields");
        if (fields == null) return null;
        
        return FirebaseSignalementDto.builder()
            .documentId(documentId)
            .latitude(getDoubleValue(fields, "latitude"))
            .longitude(getDoubleValue(fields, "longitude"))
            .description(getStringValue(fields, "description"))
            .status(getStringValue(fields, "status"))
            .surfaceM2(getBigDecimalValue(fields, "surfaceM2"))
            .budget(getBigDecimalValue(fields, "budget"))
            .idEntreprise(getLongValue(fields, "idEntreprise"))
            .userEmail(getStringValue(fields, "userEmail"))
            .firebaseUid(getStringValue(fields, "firebaseUid"))
            .dateSignalement(getTimestampValue(fields, "dateSignalement"))
            .syncedToPostgres(getBooleanValue(fields, "syncedToPostgres"))
            .build();
    }

    // ========== Helpers Firestore ==========
    
    private String getStringValue(JsonNode fields, String fieldName) {
        JsonNode field = fields.get(fieldName);
        return field != null && field.has("stringValue") ? field.get("stringValue").asText() : null;
    }

    private Double getDoubleValue(JsonNode fields, String fieldName) {
        JsonNode field = fields.get(fieldName);
        if (field != null) {
            if (field.has("doubleValue")) return field.get("doubleValue").asDouble();
            if (field.has("integerValue")) return field.get("integerValue").asDouble();
        }
        return null;
    }

    private Long getLongValue(JsonNode fields, String fieldName) {
        JsonNode field = fields.get(fieldName);
        if (field != null && field.has("integerValue")) {
            return field.get("integerValue").asLong();
        }
        return null;
    }

    private BigDecimal getBigDecimalValue(JsonNode fields, String fieldName) {
        Double value = getDoubleValue(fields, fieldName);
        return value != null ? BigDecimal.valueOf(value) : null;
    }

    private Boolean getBooleanValue(JsonNode fields, String fieldName) {
        JsonNode field = fields.get(fieldName);
        return field != null && field.has("booleanValue") && field.get("booleanValue").asBoolean();
    }

    private String getTimestampValue(JsonNode fields, String fieldName) {
        JsonNode field = fields.get(fieldName);
        return field != null && field.has("timestampValue") ? field.get("timestampValue").asText() : null;
    }

    /**
     * Trouve un utilisateur par email ou firebaseUid
     */
    private User findUserByEmailOrFirebaseUid(String email, String firebaseUid) {
        if (firebaseUid != null && !firebaseUid.isEmpty()) {
            Optional<User> byUid = userRepository.findByFirebaseUid(firebaseUid);
            if (byUid.isPresent()) return byUid.get();
        }
        if (email != null && !email.isEmpty()) {
            Optional<User> byEmail = userRepository.findByEmail(email);
            if (byEmail.isPresent()) return byEmail.get();
        }
        return null;
    }

    /**
     * Marque un signalement comme synchronisé dans Firebase (PATCH sans auth)
     */
    private void markAsSyncedInFirebase(String documentId, Long postgresId) {
        String url = firebaseConfig.getFirestoreBaseUrl() + "/signalements/" + documentId 
            + "?updateMask.fieldPaths=syncedToPostgres&updateMask.fieldPaths=postgresId";

        Map<String, Object> updateFields = new HashMap<>();
        updateFields.put("syncedToPostgres", Map.of("booleanValue", true));
        if (postgresId != null) {
            updateFields.put("postgresId", Map.of("integerValue", postgresId.toString()));
        }
        
        Map<String, Object> update = Map.of("fields", updateFields);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(update, headers);

        try {
            restTemplate.exchange(url, HttpMethod.PATCH, entity, String.class);
            logger.info("✅ Firebase {} marqué sync", documentId);
        } catch (Exception e) {
            logger.warn("⚠️ Erreur marquer sync {}: {}", documentId, e.getMessage());
        }
    }
}
