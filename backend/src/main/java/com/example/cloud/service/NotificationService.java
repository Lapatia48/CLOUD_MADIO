package com.example.cloud.service;

import com.example.cloud.dto.NotificationResponse;
import com.example.cloud.entity.Notification;
import com.example.cloud.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    
    public List<NotificationResponse> getByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByDateNotifDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<NotificationResponse> getUnreadByUserId(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByDateNotifDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public Long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
    
    @Transactional
    public NotificationResponse markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification non trouvée avec l'id: " + id));
        notification.setIsRead(true);
        Notification updated = notificationRepository.save(notification);
        return mapToResponse(updated);
    }
    
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdAndIsReadFalseOrderByDateNotifDesc(userId);
        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }
    
    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .description(notification.getDescription())
                .signalementId(notification.getSignalement() != null ? notification.getSignalement().getId() : null)
                .dateNotif(notification.getDateNotif())
                .isRead(notification.getIsRead())
                .build();
    }
}
