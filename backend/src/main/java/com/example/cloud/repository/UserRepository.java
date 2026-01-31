package com.example.cloud.repository;

import com.example.cloud.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role WHERE u.email = :email")
    Optional<User> findByEmail(@Param("email") String email);
    
    boolean existsByEmail(String email);
    
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.failedAttempts = u.failedAttempts + 1 WHERE u.email = :email")
    void incrementFailedAttempts(@Param("email") String email);
    
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.failedAttempts = 0 WHERE u.email = :email")
    void resetFailedAttempts(@Param("email") String email);
    
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.isBlocked = true WHERE u.email = :email")
    void blockUser(@Param("email") String email);
    
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.isBlocked = false, u.failedAttempts = 0 WHERE u.email = :email")
    void unblockUser(@Param("email") String email);
}