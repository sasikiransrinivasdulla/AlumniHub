package com.alumnihub.service;

import com.alumnihub.dto.NotificationDto;
import com.alumnihub.entity.Notification;
import com.alumnihub.entity.NotificationType;
import com.alumnihub.entity.User;
import com.alumnihub.repository.NotificationRepository;
import com.alumnihub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    @CacheEvict(value = "unreadNotificationsCount", key = "#recipient.id")
    public void createNotification(User recipient, User sender, NotificationType type, UUID targetId, String text) {
        if (recipient.getId().equals(sender.getId())) {
            return;
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .type(type)
                .targetId(targetId)
                .text(text)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);

        // Convert to DTO and push over WebSocket
        NotificationDto dto = convertToDto(saved);
        messagingTemplate.convertAndSend("/topic/users/" + recipient.getId() + "/notifications", dto);
    }

    public Page<NotificationDto> getUserNotifications(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        return notificationRepository.findAllByRecipientOrderByCreatedAtDesc(user, pageable)
                .map(this::convertToDto);
    }

    @Cacheable(value = "unreadNotificationsCount", key = "#userId")
    public long getUnreadCountByUserId(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }

    public long getUnreadCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        return getUnreadCountByUserId(user.getId());
    }

    @Transactional
    @CacheEvict(value = "unreadNotificationsCount", allEntries = true)
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        notificationRepository.markAllAsReadForRecipient(user);
    }

    @Transactional
    @CacheEvict(value = "unreadNotificationsCount", allEntries = true)
    public void markAsRead(String email, UUID notificationId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized access to notification.");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    private NotificationDto convertToDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .senderId(n.getSender().getId())
                .senderName(n.getSender().getFullName())
                .senderProfilePicture(n.getSender().getProfilePictureUrl())
                .type(n.getType())
                .targetId(n.getTargetId())
                .text(n.getText())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
