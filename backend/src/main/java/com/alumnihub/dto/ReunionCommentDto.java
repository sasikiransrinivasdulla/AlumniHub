package com.alumnihub.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ReunionCommentDto {
    private UUID id;
    private UUID userId;
    private String userFullName;
    private String userProfilePicture;
    private String text;
    private LocalDateTime createdAt;
}
