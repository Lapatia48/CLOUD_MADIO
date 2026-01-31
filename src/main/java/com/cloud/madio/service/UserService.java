package com.cloud.madio.service;

import com.cloud.madio.entity.User;
import com.cloud.madio.entity.Role;
import com.cloud.madio.repository.UserRepository;
import com.cloud.madio.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User register(String email, String password, String nom, String prenom, String roleName) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email déjà utilisé");
        }

        Role role = roleRepository.findByLibelle(roleName)
                .orElseThrow(() -> new RuntimeException("Rôle non trouvé"));

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setNom(nom);
        user.setPrenom(prenom);
        user.setRole(role);
        user.setIsBlocked(false);
        user.setFailedAttempts(0);

        return userRepository.save(user);
    }

    public User authenticate(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getIsBlocked()) {
            throw new RuntimeException("Compte bloqué");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            user.setFailedAttempts(user.getFailedAttempts() + 1);
            if (user.getFailedAttempts() >= 5) {
                user.setIsBlocked(true);
            }
            userRepository.save(user);
            throw new RuntimeException("Mot de passe incorrect");
        }

        user.setFailedAttempts(0);
        return userRepository.save(user);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }
}
