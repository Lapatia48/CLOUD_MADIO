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
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
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
    // Utiliser HttpComponentsClientHttpRequestFactory pour supporter PATCH
    private final RestTemplate restTemplate = new RestTemplate(new HttpComponentsClientHttpRequestFactory());
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
                signalement.setAvancement(dto.getAvancement() != null ? dto.getAvancement() : 0);
                signalement.setSurfaceM2(dto.getSurfaceM2());
                signalement.setBudget(dto.getBudget());
                signalement.setPhotoBase64(dto.getPhotoBase64());
                signalement.setPhotoUrl(dto.getPhotoUrl());
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
            .avancement(getIntegerValue(fields, "avancement"))
            .surfaceM2(getBigDecimalValue(fields, "surfaceM2"))
            .budget(getBigDecimalValue(fields, "budget"))
            .photoBase64(getStringValue(fields, "photoBase64"))
            .photoUrl(getStringValue(fields, "photoUrl"))
            .idEntreprise(getLongValue(fields, "idEntreprise"))
            .entrepriseNom(getStringValue(fields, "entrepriseNom"))
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
    
    private Integer getIntegerValue(JsonNode fields, String fieldName) {
        JsonNode field = fields.get(fieldName);
        if (field != null && field.has("integerValue")) {
            return field.get("integerValue").asInt();
        }
        return null;
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

    /**
     * Synchronise un signalement de PostgreSQL vers Firebase.
     * Utilisé quand un manager met à jour un signalement (budget, entreprise, avancement).
     * 
     * Flux: Web (PostgreSQL) → Mobile (Firebase)
     * IMPORTANT: On ne crée JAMAIS de nouveau signalement - on met à jour l'existant.
     * Le signalement existe obligatoirement dans Firebase car c'est là qu'il est créé.
     */
    public Map<String, Object> syncSignalementToFirebase(Long signalementId) {
        logger.info("=== Sync PostgreSQL → Firebase pour signalement {} ===", signalementId);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 1. Récupérer le signalement de PostgreSQL
            Optional<Signalement> optSignalement = signalementRepository.findById(signalementId);
            if (optSignalement.isEmpty()) {
                result.put("success", false);
                result.put("error", "Signalement non trouvé dans PostgreSQL");
                return result;
            }
            
            Signalement signalement = optSignalement.get();
            
            // 2. Chercher le document Firebase correspondant par postgresId (priorité)
            //    puis par coordonnées si pas trouvé
            String firebaseDocId = findFirebaseDocumentByPostgresId(signalementId);
            
            if (firebaseDocId == null) {
                // Fallback: chercher par coordonnées
                logger.info("Pas trouvé par postgresId, recherche par coordonnées...");
                firebaseDocId = findFirebaseDocumentByCoordinates(
                    signalement.getLatitude(), 
                    signalement.getLongitude()
                );
            }
            
            // 3. Si pas de document trouvé, c'est une erreur (le signalement doit venir de Firebase)
            if (firebaseDocId == null) {
                logger.error("Aucun document Firebase trouvé pour signalement {} - impossible de synchroniser", signalementId);
                result.put("success", false);
                result.put("error", "Aucun document Firebase correspondant trouvé. " +
                    "Le signalement doit d'abord être créé depuis le mobile.");
                return result;
            }
            
            // 4. Mettre à jour le document Firebase existant
            boolean updated = updateSignalementInFirebase(firebaseDocId, signalement);
            
            if (!updated) {
                logger.error("Échec de la mise à jour du document Firebase {}", firebaseDocId);
                result.put("success", false);
                result.put("error", "Échec de la mise à jour du document Firebase");
                return result;
            }
            
            result.put("success", true);
            result.put("signalementId", signalementId);
            result.put("firebaseDocId", firebaseDocId);
            result.put("message", "Signalement synchronisé vers Firebase avec succès");
                
        } catch (Exception e) {
            logger.error("Erreur sync vers Firebase: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }

    /**
     * Recherche un document Firebase par son postgresId
     */
    private String findFirebaseDocumentByPostgresId(Long postgresId) {
        String url = firebaseConfig.getFirestoreBaseUrl() + "/signalements";
        
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode documents = root.get("documents");
            
            if (documents != null && documents.isArray()) {
                for (JsonNode doc : documents) {
                    JsonNode fields = doc.get("fields");
                    if (fields != null) {
                        Long docPostgresId = getLongValue(fields, "postgresId");
                        
                        if (docPostgresId != null && docPostgresId.equals(postgresId)) {
                            String fullName = doc.get("name").asText();
                            String docId = fullName.substring(fullName.lastIndexOf('/') + 1);
                            logger.info("Document Firebase trouvé par postgresId={}: {}", postgresId, docId);
                            return docId;
                        }
                    }
                }
            }
            logger.warn("Aucun document Firebase trouvé avec postgresId={}", postgresId);
        } catch (Exception e) {
            logger.error("Erreur recherche Firebase par postgresId: {}", e.getMessage());
        }
        
        return null;
    }

    /**
     * Recherche un document Firebase par coordonnées GPS
     */
    private String findFirebaseDocumentByCoordinates(Double latitude, Double longitude) {
        String url = firebaseConfig.getFirestoreBaseUrl() + "/signalements";
        
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode documents = root.get("documents");
            
            if (documents != null && documents.isArray()) {
                for (JsonNode doc : documents) {
                    JsonNode fields = doc.get("fields");
                    if (fields != null) {
                        Double lat = getDoubleValue(fields, "latitude");
                        Double lng = getDoubleValue(fields, "longitude");
                        
                        // Comparer avec tolérance (environ 10m)
                        if (lat != null && lng != null &&
                            Math.abs(lat - latitude) < 0.0001 && 
                            Math.abs(lng - longitude) < 0.0001) {
                            String fullName = doc.get("name").asText();
                            return fullName.substring(fullName.lastIndexOf('/') + 1);
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Erreur recherche Firebase: {}", e.getMessage());
        }
        
        return null;
    }

    /**
     * Crée un nouveau signalement dans Firebase
     */
    private String createSignalementInFirebase(Signalement signalement) {
        String url = firebaseConfig.getFirestoreBaseUrl() + "/signalements";
        
        Map<String, Object> fields = buildFirebaseFields(signalement);
        Map<String, Object> document = Map.of("fields", fields);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(document, headers);
        
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            String fullName = root.get("name").asText();
            String docId = fullName.substring(fullName.lastIndexOf('/') + 1);
            logger.info("✅ Signalement créé dans Firebase: {}", docId);
            return docId;
        } catch (Exception e) {
            logger.error("Erreur création Firebase: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Met à jour un signalement existant dans Firebase
     * Note: On utilise PUT au lieu de PATCH car RestTemplate ne supporte pas PATCH par défaut
     * @return true si succès, false si le document n'existe pas ou erreur
     */
    private boolean updateSignalementInFirebase(String documentId, Signalement signalement) {
        String getUrl = firebaseConfig.getFirestoreBaseUrl() + "/signalements/" + documentId;
        
        try {
            // 1. D'abord vérifier si le document existe
            ResponseEntity<String> getResponse;
            try {
                getResponse = restTemplate.getForEntity(getUrl, String.class);
            } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
                logger.warn("Document Firebase {} n'existe pas (404)", documentId);
                return false; // Le document n'existe pas, retourner false pour déclencher la création
            }
            
            JsonNode existingDoc = objectMapper.readTree(getResponse.getBody());
            JsonNode existingFields = existingDoc.get("fields");
            
            // 2. Construire le nouveau document en préservant les champs existants
            Map<String, Object> fields = new HashMap<>();
            
            // Préserver les champs originaux du mobile
            if (existingFields != null) {
                // Latitude/Longitude (obligatoires)
                if (existingFields.has("latitude")) {
                    fields.put("latitude", Map.of("doubleValue", getDoubleValue(existingFields, "latitude")));
                }
                if (existingFields.has("longitude")) {
                    fields.put("longitude", Map.of("doubleValue", getDoubleValue(existingFields, "longitude")));
                }
                // User info
                if (existingFields.has("userEmail")) {
                    fields.put("userEmail", Map.of("stringValue", getStringValue(existingFields, "userEmail")));
                }
                if (existingFields.has("firebaseUid")) {
                    fields.put("firebaseUid", Map.of("stringValue", getStringValue(existingFields, "firebaseUid")));
                }
                // Photo
                if (existingFields.has("photoBase64")) {
                    String photo = getStringValue(existingFields, "photoBase64");
                    if (photo != null && !photo.isEmpty()) {
                        fields.put("photoBase64", Map.of("stringValue", photo));
                    }
                }
                if (existingFields.has("photoUrl")) {
                    String photoUrl = getStringValue(existingFields, "photoUrl");
                    if (photoUrl != null && !photoUrl.isEmpty()) {
                        fields.put("photoUrl", Map.of("stringValue", photoUrl));
                    }
                }
                // Date de création
                if (existingFields.has("dateSignalement")) {
                    JsonNode dateNode = existingFields.get("dateSignalement");
                    if (dateNode.has("timestampValue")) {
                        fields.put("dateSignalement", Map.of("timestampValue", dateNode.get("timestampValue").asText()));
                    } else if (dateNode.has("stringValue")) {
                        fields.put("dateSignalement", Map.of("stringValue", dateNode.get("stringValue").asText()));
                    }
                }
            }
            
            // 3. Mettre à jour avec les données de PostgreSQL (manager)
            // Status
            fields.put("status", Map.of("stringValue", signalement.getStatus() != null ? signalement.getStatus() : "NOUVEAU"));
            
            // Avancement
            int avancement = signalement.getAvancement() != null ? signalement.getAvancement() : 0;
            if (avancement == 0) {
                if ("EN_COURS".equals(signalement.getStatus())) avancement = 50;
                else if ("TERMINE".equals(signalement.getStatus())) avancement = 100;
            }
            fields.put("avancement", Map.of("integerValue", String.valueOf(avancement)));
            
            // Budget
            if (signalement.getBudget() != null) {
                fields.put("budget", Map.of("doubleValue", signalement.getBudget().doubleValue()));
            }
            
            // Surface
            if (signalement.getSurfaceM2() != null) {
                fields.put("surfaceM2", Map.of("doubleValue", signalement.getSurfaceM2().doubleValue()));
            }
            
            // Entreprise
            if (signalement.getEntreprise() != null) {
                fields.put("entrepriseNom", Map.of("stringValue", signalement.getEntreprise().getNom()));
                fields.put("idEntreprise", Map.of("integerValue", String.valueOf(signalement.getEntreprise().getId())));
            }
            
            // Description
            if (signalement.getDescription() != null) {
                fields.put("description", Map.of("stringValue", signalement.getDescription()));
            }
            
            // PostgreSQL ID
            fields.put("postgresId", Map.of("integerValue", String.valueOf(signalement.getId())));
            
            // Flags de sync
            fields.put("syncedToPostgres", Map.of("booleanValue", true));
            fields.put("syncedFromPostgres", Map.of("booleanValue", true));
            
            // Timestamp de mise à jour
            fields.put("updatedAt", Map.of("timestampValue", java.time.Instant.now().toString()));
            
            // 4. Envoyer avec PATCH (met à jour les champs spécifiés)
            Map<String, Object> document = Map.of("fields", fields);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(document, headers);
            
            // PATCH avec updateMask pour mettre à jour tous les champs
            restTemplate.exchange(getUrl, HttpMethod.PATCH, entity, String.class);
            logger.info("✅ Signalement {} mis à jour dans Firebase (PATCH)", documentId);
            return true;
            
        } catch (Exception e) {
            logger.error("Erreur update Firebase: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Construit les champs Firestore pour un signalement
     */
    private Map<String, Object> buildFirebaseFields(Signalement signalement) {
        Map<String, Object> fields = new HashMap<>();
        
        fields.put("latitude", Map.of("doubleValue", signalement.getLatitude()));
        fields.put("longitude", Map.of("doubleValue", signalement.getLongitude()));
        
        if (signalement.getDescription() != null) {
            fields.put("description", Map.of("stringValue", signalement.getDescription()));
        }
        
        fields.put("status", Map.of("stringValue", signalement.getStatus() != null ? signalement.getStatus() : "NOUVEAU"));
        
        int avancement = 0;
        if ("EN_COURS".equals(signalement.getStatus())) avancement = 50;
        else if ("TERMINE".equals(signalement.getStatus())) avancement = 100;
        fields.put("avancement", Map.of("integerValue", String.valueOf(avancement)));
        
        if (signalement.getBudget() != null) {
            fields.put("budget", Map.of("doubleValue", signalement.getBudget().doubleValue()));
        }
        
        if (signalement.getSurfaceM2() != null) {
            fields.put("surfaceM2", Map.of("doubleValue", signalement.getSurfaceM2().doubleValue()));
        }
        
        if (signalement.getEntreprise() != null) {
            fields.put("entrepriseNom", Map.of("stringValue", signalement.getEntreprise().getNom()));
            fields.put("idEntreprise", Map.of("integerValue", String.valueOf(signalement.getEntreprise().getId())));
        }
        
        if (signalement.getUser() != null) {
            fields.put("userEmail", Map.of("stringValue", signalement.getUser().getEmail()));
        }
        
        fields.put("dateSignalement", Map.of("timestampValue", 
            signalement.getDateSignalement() != null ? 
                signalement.getDateSignalement().toString() + "Z" : 
                java.time.Instant.now().toString()));
        
        fields.put("syncedToPostgres", Map.of("booleanValue", true));
        fields.put("postgresId", Map.of("integerValue", String.valueOf(signalement.getId())));
        fields.put("syncedFromPostgres", Map.of("booleanValue", true));
        
        return fields;
    }
}
