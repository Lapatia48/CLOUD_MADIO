package com.example.cloud.repository;

import com.example.cloud.entity.Session;
import com.example.cloud.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    @Modifying(clearAutomatically = true)
    @Query("UPDATE User u SET u.failedAttempts = u.failedAttempts + 1 WHERE u.email = ?1")
    void incrementFailedAttempts(String email);
    
    @Modifying(clearAutomatically = true)
    @Query("UPDATE User u SET u.failedAttempts = 0 WHERE u.email = ?1")
    void resetFailedAttempts(String email);
    
    @Modifying(clearAutomatically = true)
    @Query("UPDATE User u SET u.isBlocked = true WHERE u.email = ?1")
    void blockUser(String email);
    
    @Modifying(clearAutomatically = true)
    @Query("UPDATE User u SET u.isBlocked = false, u.failedAttempts = 0 WHERE u.email = ?1")
    void unblockUser(String email);
    
    List<User> findByIsBlockedTrue();
}