package com.example.cloud.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    @JsonIgnore
    private String password;
    
    private String nom;
    
    private String prenom;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_role", referencedColumnName = "id")
    private Role role;
    
    @Column(name = "is_blocked")
    @Builder.Default
    private boolean isBlocked = false;
    
    @Column(name = "failed_attempts")
    @Builder.Default
    private int failedAttempts = 0;
    
    @Column(name = "firebase_uid")
    private String firebaseUid;
}