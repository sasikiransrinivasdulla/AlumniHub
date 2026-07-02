package com.alumnihub.dto;

import com.alumnihub.entity.NotificationType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {
    private UUID id;
    private UUID senderId;
    private String senderName;
    private String senderProfilePicture;
    private NotificationType type;
    private UUID targetId;
    private String text;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
