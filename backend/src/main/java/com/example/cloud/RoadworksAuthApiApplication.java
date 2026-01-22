package com.example.cloud;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RoadworksAuthApiApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(RoadworksAuthApiApplication.class, args);
    }
}