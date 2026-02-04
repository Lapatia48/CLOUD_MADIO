package com.example.cloud.service;

import com.example.cloud.config.FirebaseConfig;
import com.example.cloud.dto.*;
import com.example.cloud.entity.Role;
import com.example.cloud.entity.User;
import com.example.cloud.entity.Session;
import com.example.cloud.repository.RoleRepository;
import com.example.cloud.repository.UserRepository;
import com.example.cloud.repository.SessionRepository;
import com.example.cloud.util.JwtUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final FirebaseConfig firebaseConfig;
    private final RestTemplate restTemplate = new RestTemplate(new HttpComponentsClientHttpRequestFactory());
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AuthResponse register(RegisterRequest request) {
        long userCount = userRepository.count();
        String roleLibelle = (userCount == 0) ? "ADMIN" : "USER";

        Role role = roleRepository.findByLibelle(roleLibelle)
                .orElseThrow(() -> new RuntimeException("Role " + roleLibelle + " non trouvé"));

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // Stocké en clair, pas de hash
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setRole(role);
        user.setBlocked(false);

        user = userRepository.saveAndFlush(user);
        
        // Sync vers Firebase avec le password
        syncUserToFirebase(user, false, request.getPassword());

        String roleName = getRoleName(user);
        Long idRole = user.getRole() != null ? user.getRole().getId() : null;
        String token = jwtUtil.generateToken(user.getEmail(), roleName);
        saveSession(user, token);

        return AuthResponse.builder()
                .userId(user.getId())
                .token(token)
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(roleName)
                .idRole(idRole)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.isBlocked()) {
            throw new RuntimeException("Compte bloqué. Contactez un administrateur.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (Exception e) {
            throw new RuntimeException("Accès refusé. Veuillez vérifier vos identifiants.");
        }

        String roleName = getRoleName(user);
        Long idRole = user.getRole() != null ? user.getRole().getId() : null;
        String token = jwtUtil.generateToken(user.getEmail(), roleName);
        saveSession(user, token);

        return AuthResponse.builder()
                .userId(user.getId())
                .token(token)
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(roleName)
                .idRole(idRole)
                .build();
    }

    public void logout(String token) {
        sessionRepository.deleteByToken(token);
    }

    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (request.getNom() != null) user.setNom(request.getNom());
        if (request.getPrenom() != null) user.setPrenom(request.getPrenom());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(request.getPassword()); // Password en clair
        }
        if (request.getBlocked() != null) user.setBlocked(request.getBlocked());

        userRepository.save(user);
        
        // Sync vers Firebase avec password si fourni
        syncUserToFirebase(user, false, request.getPassword());
        
        return mapToUserResponse(user);
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return mapToUserResponse(user);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }
    
    public List<UserResponse> getAllUsersByRole(String roleLibelle) {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && roleLibelle.equals(u.getRole().getLibelle()))
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        // Supprimer de Firebase d'abord (par postgresId)
        deleteUserFromFirebase(user.getId());
        
        // Supprimer de la base
        userRepository.delete(user);
        logger.info("✅ Utilisateur {} supprimé", user.getEmail());
    }

    /**
     * Débloque un utilisateur : met à jour PostgreSQL ET Firebase
     * - PostgreSQL: isBlocked = false
     * - Firebase: isBlocked = false, failedAttempts = 0
     */
    public Map<String, Object> unblockUser(String email) {
        Map<String, Object> result = new HashMap<>();
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setBlocked(false);
        userRepository.save(user);
        
        // Sync vers Firebase (reset failedAttempts à 0 et isBlocked à false)
        syncUserToFirebase(user, true); // true = reset failed attempts
        
        result.put("success", true);
        result.put("email", email);
        result.put("message", "Compte débloqué et synchronisé vers Firebase");
        
        return result;
    }

    /**
     * Synchronise un utilisateur vers Firebase (CREATE ou UPDATE)
     * Utilise postgresId comme ID de document Firebase
     */
    public void syncUserToFirebase(User user) {
        syncUserToFirebase(user, false, null);
    }
    
    public void syncUserToFirebase(User user, boolean resetFailedAttempts) {
        syncUserToFirebase(user, resetFailedAttempts, null);
    }
    
    public void syncUserToFirebase(User user, boolean resetFailedAttempts, String password) {
        // Utiliser postgresId comme ID de document Firebase
        String docId = String.valueOf(user.getId());
        String url = firebaseConfig.getFirestoreBaseUrl() + "/users/" + docId;
        
        Map<String, Object> fields = new HashMap<>();
        fields.put("email", Map.of("stringValue", user.getEmail()));
        fields.put("postgresId", Map.of("integerValue", String.valueOf(user.getId())));
        fields.put("isBlocked", Map.of("booleanValue", user.isBlocked()));
        fields.put("failedAttempts", Map.of("integerValue", resetFailedAttempts ? "0" : "0"));
        
        // Toujours envoyer le password (soit le nouveau, soit celui stocké en base)
        String pwd = (password != null && !password.isEmpty()) ? password : user.getPassword();
        if (pwd != null && !pwd.isEmpty()) {
            fields.put("password", Map.of("stringValue", pwd));
        }
        
        if (user.getNom() != null) {
            fields.put("nom", Map.of("stringValue", user.getNom()));
        }
        if (user.getPrenom() != null) {
            fields.put("prenom", Map.of("stringValue", user.getPrenom()));
        }
        if (user.getRole() != null) {
            fields.put("role", Map.of("stringValue", user.getRole().getLibelle()));
        }
        if (user.getFirebaseUid() != null) {
            fields.put("firebaseUid", Map.of("stringValue", user.getFirebaseUid()));
        }
        
        fields.put("updatedAt", Map.of("timestampValue", java.time.Instant.now().toString()));
        
        Map<String, Object> document = Map.of("fields", fields);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(document, headers);
        
        try {
            // PATCH crée le document s'il n'existe pas, ou le met à jour
            restTemplate.exchange(url, HttpMethod.PATCH, entity, String.class);
            logger.info("✅ User {} (id={}) synchronisé vers Firebase", user.getEmail(), user.getId());
        } catch (Exception e) {
            logger.error("Erreur sync user vers Firebase: {}", e.getMessage());
        }
    }
    
    /**
     * Supprime un utilisateur de Firebase par postgresId
     */
    private void deleteUserFromFirebase(Long postgresId) {
        String docId = String.valueOf(postgresId);
        String url = firebaseConfig.getFirestoreBaseUrl() + "/users/" + docId;
        
        try {
            restTemplate.delete(url);
            logger.info("✅ User id={} supprimé de Firebase", postgresId);
        } catch (Exception e) {
            logger.warn("Erreur suppression Firebase (peut-être inexistant): {}", e.getMessage());
        }
    }
    
    /**
     * Synchronise les statuts blocked de Firebase vers PostgreSQL
     * Récupère tous les users de Firebase et met à jour isBlocked dans PostgreSQL
     * Utilise postgresId pour identifier les utilisateurs
     */
    public Map<String, Object> syncBlockedStatusFromFirebase() {
        Map<String, Object> result = new HashMap<>();
        int updated = 0;
        int errors = 0;
        List<String> updatedUsers = new ArrayList<>();
        
        try {
            // Récupérer tous les documents de la collection users de Firebase
            String url = firebaseConfig.getFirestoreBaseUrl() + "/users";
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.getBody());
            JsonNode documents = root.get("documents");
            
            if (documents != null && documents.isArray()) {
                for (JsonNode doc : documents) {
                    try {
                        JsonNode fields = doc.get("fields");
                        if (fields == null) continue;
                        
                        // Extraire postgresId et isBlocked
                        Long postgresId = fields.has("postgresId") ? 
                            Long.parseLong(fields.get("postgresId").get("integerValue").asText()) : null;
                        String email = fields.has("email") ? 
                            fields.get("email").get("stringValue").asText() : null;
                        boolean isBlocked = fields.has("isBlocked") ? 
                            fields.get("isBlocked").get("booleanValue").asBoolean() : false;
                        
                        if (postgresId != null) {
                            Optional<User> optUser = userRepository.findById(postgresId);
                            if (optUser.isPresent()) {
                                User user = optUser.get();
                                if (user.isBlocked() != isBlocked) {
                                    user.setBlocked(isBlocked);
                                    userRepository.save(user);
                                    updated++;
                                    updatedUsers.add(email + " (id=" + postgresId + ") -> " + (isBlocked ? "BLOQUÉ" : "DÉBLOQUÉ"));
                                    logger.info("✅ Statut de {} (id={}) mis à jour: isBlocked={}", email, postgresId, isBlocked);
                                }
                            }
                        }
                    } catch (Exception e) {
                        errors++;
                        logger.error("Erreur traitement document: {}", e.getMessage());
                    }
                }
            }
            
            result.put("success", true);
            result.put("updated", updated);
            result.put("errors", errors);
            result.put("updatedUsers", updatedUsers);
            result.put("message", "Synchronisation terminée: " + updated + " utilisateurs mis à jour");
            
        } catch (Exception e) {
            logger.error("Erreur sync depuis Firebase: {}", e.getMessage());
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }

    private void saveSession(User user, String token) {
        Session session = Session.builder()
                .user(user)
                .token(token)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .isValid(true)
                .build();
        sessionRepository.save(session);
    }

    private String getRoleName(User user) {
        if (user.getRole() != null && user.getRole().getLibelle() != null) {
            return user.getRole().getLibelle();
        }
        return "USER";
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .password(user.getPassword())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(getRoleName(user))
                .blocked(user.isBlocked())
                .firebaseUid(user.getFirebaseUid())
                .build();
    }
}