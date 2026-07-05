package com.alumnihub.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ReferralDto {
    private UUID id;
    private String company;
    private String role;
    private String location;
    private String experienceRequired;
    private String salaryRange;
    private LocalDateTime deadline;
    private String requirements;
    private UUID creatorId;
    private String creatorName;
}
