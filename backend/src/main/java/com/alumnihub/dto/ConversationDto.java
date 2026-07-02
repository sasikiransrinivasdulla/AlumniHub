package com.alumnihub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationDto {
    private UUID id;
    private UserDto participant;
    private String lastMessageText;
    private String lastMessageImageUrl;
    private LocalDateTime lastMessageTime;
    private long unreadCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
