package com.example.cloud.service;

import com.example.cloud.config.FirebaseConfig;
import com.example.cloud.entity.Configuration;
import com.example.cloud.repository.ConfigurationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ConfigurationService {

    private static final Logger logger = LoggerFactory.getLogger(ConfigurationService.class);

    private final ConfigurationRepository configurationRepository;
    private final FirebaseConfig firebaseConfig;
    private final RestTemplate restTemplate = new RestTemplate(new HttpComponentsClientHttpRequestFactory());
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Configuration> findAll() {
        return configurationRepository.findAll();
    }

    public Optional<Configuration> findByLibelle(String libelle) {
        return configurationRepository.findByLibelle(libelle);
    }

    public Configuration save(Configuration configuration) {
        return configurationRepository.save(configuration);
    }

    public Optional<Configuration> update(String libelle, String newValue) {
        Optional<Configuration> optConfig = configurationRepository.findByLibelle(libelle);
        if (optConfig.isPresent()) {
            Configuration config = optConfig.get();
            config.setValeur(newValue);
            return Optional.of(configurationRepository.save(config));
        }
        return Optional.empty();
    }

    public int getMaxAttempts() {
        return configurationRepository.findByLibelle("max_attempts")
                .map(c -> Integer.parseInt(c.getValeur()))
                .orElse(3);
    }

    /**
     * Synchronise toutes les configurations vers Firebase
     */
    public Map<String, Object> syncAllConfigToFirebase() {
        logger.info("=== Sync Configuration → Firebase ===");
        Map<String, Object> result = new HashMap<>();
        
        try {
            List<Configuration> configs = configurationRepository.findAll();
            
            for (Configuration config : configs) {
                syncConfigToFirebase(config);
            }
            
            result.put("success", true);
            result.put("synced", configs.size());
            result.put("message", "Configuration synchronisée vers Firebase");
            
        } catch (Exception e) {
            logger.error("Erreur sync config vers Firebase: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }

    /**
     * Synchronise une configuration vers Firebase
     */
    public void syncConfigToFirebase(Configuration config) {
        String url = firebaseConfig.getFirestoreBaseUrl() + "/configuration/" + config.getLibelle();
        
        Map<String, Object> fields = new HashMap<>();
        fields.put("libelle", Map.of("stringValue", config.getLibelle()));
        fields.put("valeur", Map.of("stringValue", config.getValeur()));
        fields.put("updatedAt", Map.of("timestampValue", java.time.Instant.now().toString()));
        
        Map<String, Object> document = Map.of("fields", fields);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(document, headers);
        
        try {
            // Utiliser PATCH pour créer ou mettre à jour
            restTemplate.exchange(url, HttpMethod.PATCH, entity, String.class);
            logger.info("✅ Configuration {} synchronisée vers Firebase", config.getLibelle());
        } catch (Exception e) {
            logger.error("Erreur sync config {}: {}", config.getLibelle(), e.getMessage());
        }
    }

    /**
     * Met à jour max_attempts et sync vers Firebase
     */
    public Map<String, Object> updateMaxAttempts(int newValue) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Optional<Configuration> optConfig = update("max_attempts", String.valueOf(newValue));
            
            if (optConfig.isPresent()) {
                syncConfigToFirebase(optConfig.get());
                result.put("success", true);
                result.put("maxAttempts", newValue);
                result.put("message", "max_attempts mis à jour et synchronisé");
            } else {
                result.put("success", false);
                result.put("error", "Configuration max_attempts non trouvée");
            }
            
        } catch (Exception e) {
            logger.error("Erreur update max_attempts: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
}
