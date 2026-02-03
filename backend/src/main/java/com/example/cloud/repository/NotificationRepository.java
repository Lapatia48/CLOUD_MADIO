package com.example.cloud.repository;

import com.example.cloud.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByUserIdOrderByDateNotifDesc(Long userId);
    
    List<Notification> findByUserIdAndIsReadFalseOrderByDateNotifDesc(Long userId);
    
    Long countByUserIdAndIsReadFalse(Long userId);
}
