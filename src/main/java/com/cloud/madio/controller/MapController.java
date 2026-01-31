package com.cloud.madio.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MapController {

    @GetMapping("/map")
    public String showMap() {
        return "map"; // Retourne la vue map.html
    }

    @GetMapping("/")
    public String home() {
        return "redirect:/map"; // Redirection vers la carte par défaut
    }
}
