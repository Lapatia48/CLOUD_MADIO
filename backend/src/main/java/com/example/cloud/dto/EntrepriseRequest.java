package com.example.cloud.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntrepriseRequest {
    
    @NotBlank(message = "Le nom est obligatoire")
    private String nom;
    
    private String adresse;
    
    private String telephone;
    
    @Email(message = "Email invalide")
    private String email;
}
