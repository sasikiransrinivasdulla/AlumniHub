package com.alumnihub.controller;

import com.alumnihub.dto.NotificationDto;
import com.alumnihub.entity.NotificationType;
import com.alumnihub.entity.User;
import com.alumnihub.repository.UserRepository;
import com.alumnihub.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<NotificationDto>> getNotifications(
            Principal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<NotificationDto> notifications = notificationService.getUserNotifications(principal.getName(), pageable);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(Principal principal) {
        long count = notificationService.getUnreadCount(principal.getName());
        return ResponseEntity.ok(count);
    }

    @PostMapping("/read")
    public ResponseEntity<Void> markAllAsRead(Principal principal) {
        notificationService.markAllAsRead(principal.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(Principal principal, @PathVariable UUID id) {
        notificationService.markAsRead(principal.getName(), id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(Principal principal, @PathVariable UUID id) {
        notificationService.deleteNotification(principal.getName(), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reunion-test")
    public ResponseEntity<Void> triggerReunionTest(Principal principal) {
        User recipient = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getName()));
        notificationService.createNotification(
                recipient,
                null,
                NotificationType.REUNION_INVITATION,
                UUID.randomUUID(),
                "Reunion Invitation: Vasavi CSE '22 Annual Get-Together on July 25th at 6 PM!"
        );
        return ResponseEntity.ok().build();
    }

    @PostMapping("/event-test")
    public ResponseEntity<Void> triggerEventTest(Principal principal) {
        User recipient = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getName()));
        notificationService.createNotification(
                recipient,
                null,
                NotificationType.EVENT_REMINDER,
                UUID.randomUUID(),
                "Event Reminder: 'Startup Funding & Mentoring' Webinar begins in 30 minutes!"
        );
        return ResponseEntity.ok().build();
    }
}
