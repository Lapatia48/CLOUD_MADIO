package com.example.cloud.service;

import com.example.cloud.entity.User;
import com.example.cloud.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final UserRepository userRepository;
    private static final int MAX_ATTEMPTS = 3;

    public void loginFailed(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setFailedAttempts(user.getFailedAttempts() + 1);
            if (user.getFailedAttempts() >= MAX_ATTEMPTS) {
                user.setBlocked(true);
            }
            userRepository.save(user);
        });
    }

    public void loginSucceeded(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setFailedAttempts(0);
            userRepository.save(user);
        });
    }

    public boolean isBlocked(String email) {
        return userRepository.findByEmail(email)
                .map(User::isBlocked)
                .orElse(false);
    }
}
