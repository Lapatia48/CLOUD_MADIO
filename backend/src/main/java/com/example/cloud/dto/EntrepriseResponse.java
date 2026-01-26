package com.example.cloud.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntrepriseResponse {
    
    private Long id;
    private String nom;
    private String adresse;
    private String telephone;
    private String email;
}
