package com.example.cloud.controller;

import com.example.cloud.dto.NotificationResponse;
import com.example.cloud.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {
    
    private final NotificationService notificationService;
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationResponse>> getByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getByUserId(userId));
    }
    
    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUnreadByUserId(userId));
    }
    
    @GetMapping("/user/{userId}/count")
    public ResponseEntity<Map<String, Long>> countUnread(@PathVariable Long userId) {
        Long count = notificationService.countUnread(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }
    
    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }
    
    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllAsRead(@PathVariable Long userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }
}
