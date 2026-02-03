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
    
    @Column
    private String nom;
    
    @Column
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

    public User(String email, String firebaseUid, Long id, String nom, String password, String prenom, Role role) {
        this.email = email;
        this.firebaseUid = firebaseUid;
        this.id = id;
        this.nom = nom;
        this.password = password;
        this.prenom = prenom;
        this.role = role;
    }

    public boolean isBlocked(){
        return this.isBlocked;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isIsBlocked() {
        return isBlocked;
    }

    public void setIsBlocked(boolean isBlocked) {
        this.isBlocked = isBlocked;
    }

    public int getFailedAttempts() {
        return failedAttempts;
    }

    public void setFailedAttempts(int failedAttempts) {
        this.failedAttempts = failedAttempts;
    }

    public void setBlocked(boolean b){
        this.isBlocked=b;
    }
}