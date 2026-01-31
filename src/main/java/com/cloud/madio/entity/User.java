package com.cloud.madio.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 100)
    private String nom;

    @Column(length = 100)
    private String prenom;

    @ManyToOne
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "is_blocked")
    private Boolean isBlocked = false;

    @Column(name = "failed_attempts")
    private Integer failedAttempts = 0;

    @Column(name = "firebase_uid")
    private String firebaseUid;
}
