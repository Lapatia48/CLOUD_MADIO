package com.example.cloud.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Configuration Firebase pour la synchronisation avec l'application mobile.
 * Utilise l'API REST Firebase (Identity Toolkit + Firestore) sans SDK Admin.
 */
@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.api-key:AIzaSyAZDq6XBscA4ys06AJptbvjOSKLrqAa1Yc}")
    private String apiKey;

    @Value("${firebase.project-id:cloud-s5-91071}")
    private String projectId;

    @PostConstruct
    public void init() {
        logger.info("Firebase configuration initialized");
        logger.info("Firebase Project ID: {}", projectId);
    }

    public String getApiKey() {
        return apiKey;
    }

    public String getProjectId() {
        return projectId;
    }

    public String getFirestoreBaseUrl() {
        return "https://firestore.googleapis.com/v1/projects/" + projectId + "/databases/(default)/documents";
    }

    public String getAuthSignUpUrl() {
        return "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + apiKey;
    }

    public String getAuthSignInUrl() {
        return "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + apiKey;
    }
}
