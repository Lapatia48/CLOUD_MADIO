package com.example.cloud.scheduler;

import com.example.cloud.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class SessionCleanupScheduler {

    private final SessionRepository sessionRepository;

    @Scheduled(fixedRate = 3600000) // Toutes les heures
    public void cleanupExpiredSessions() {
        sessionRepository.deleteExpiredSessions(LocalDateTime.now());
    }
}