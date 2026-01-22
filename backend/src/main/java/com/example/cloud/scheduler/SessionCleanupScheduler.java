package com.example.cloud.scheduler;

import com.example.cloud.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class SessionCleanupScheduler {
    
    private final SessionRepository sessionRepository;
    
    @Scheduled(cron = "0 0 2 * * ?") // Runs daily at 2 AM
    @Transactional
    public void cleanupExpiredSessions() {
        sessionRepository.deleteExpiredSessions(LocalDateTime.now());
    }
}