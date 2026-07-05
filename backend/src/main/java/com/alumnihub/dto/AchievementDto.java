package com.alumnihub.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AchievementDto {
    private UUID id;
    private UUID userId;
    private String userFullName;
    private String userProfilePicture;
    private String type;
    private String title;
    private String description;
    private String companyOrInstitution;
    private LocalDateTime date;
    private String link;
}
