package com.alumnihub.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class MentorshipRequestCreateDto {
    private UUID mentorId;
    private String message;
    private LocalDateTime sessionDate;
}
