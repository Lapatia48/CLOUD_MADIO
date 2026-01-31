package com.cloud.madio.controller;

import com.cloud.madio.entity.User;
import com.cloud.madio.service.UserService;
import com.cloud.madio.dto.LoginRequest;
import com.cloud.madio.dto.RegisterRequest;
import com.cloud.madio.dto.AuthResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.authenticate(request.getEmail(), request.getPassword());
            AuthResponse response = new AuthResponse();
            response.setSuccess(true);
            response.setMessage("Connexion réussie");
            response.setUserId(user.getId());
            response.setEmail(user.getEmail());
            response.setRole(user.getRole().getLibelle());
            response.setRedirectUrl("/map"); // Redirection directe vers la carte
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            AuthResponse response = new AuthResponse();
            response.setSuccess(false);
            response.setMessage(e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.register(
                request.getEmail(),
                request.getPassword(),
                request.getNom(),
                request.getPrenom(),
                request.getRole() != null ? request.getRole() : "USER"
            );
            AuthResponse response = new AuthResponse();
            response.setSuccess(true);
            response.setMessage("Inscription réussie");
            response.setUserId(user.getId());
            response.setEmail(user.getEmail());
            response.setRole(user.getRole().getLibelle());
            response.setRedirectUrl("/map"); // Redirection directe vers la carte
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            AuthResponse response = new AuthResponse();
            response.setSuccess(false);
            response.setMessage(e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
