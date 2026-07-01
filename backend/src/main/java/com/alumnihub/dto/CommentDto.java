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
public class CommentDto {
    private UUID id;
    private UUID userId;
    private String userFullName;
    private String userProfilePicture;
    private String userCurrentPosition;
    private String comment;
    private LocalDateTime createdAt;
}
