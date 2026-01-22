package com.example.cloud.service;

import com.example.cloud.entity.User;
import com.example.cloud.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LoginAttemptService {
    
    private final UserRepository userRepository;
    
    @Value("${jwt.max-login-attempts:3}")
    private int maxLoginAttempts;
    
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleFailedLogin(String email) {
        userRepository.incrementFailedAttempts(email);
        userRepository.flush();
        
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null && user.getFailedAttempts() >= maxLoginAttempts) {
            userRepository.blockUser(email);
        }
    }
    
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void resetFailedAttempts(String email) {
        userRepository.resetFailedAttempts(email);
    }
}
