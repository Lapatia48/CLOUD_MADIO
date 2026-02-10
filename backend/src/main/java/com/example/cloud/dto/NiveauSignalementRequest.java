package com.example.cloud.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NiveauSignalementRequest {

    @NotNull(message = "L'id du signalement est obligatoire")
    private Long idSignalement;

    @NotNull(message = "Le niveau est obligatoire")
    @Min(value = 1, message = "Le niveau minimum est 1")
    @Max(value = 10, message = "Le niveau maximum est 10")
    private Integer niveau;
}
