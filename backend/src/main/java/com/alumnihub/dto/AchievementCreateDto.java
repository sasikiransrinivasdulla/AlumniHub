package com.alumnihub.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AchievementCreateDto {
    private String type;
    private String title;
    private String description;
    private String companyOrInstitution;
    private LocalDateTime date;
    private String link;
}
