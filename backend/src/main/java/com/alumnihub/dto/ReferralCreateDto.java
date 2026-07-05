package com.alumnihub.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ReferralCreateDto {
    private String company;
    private String role;
    private String location;
    private String experienceRequired;
    private String salaryRange;
    private LocalDateTime deadline;
    private String requirements;
}
