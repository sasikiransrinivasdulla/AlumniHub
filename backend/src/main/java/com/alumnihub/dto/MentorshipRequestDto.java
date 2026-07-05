package com.alumnihub.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MentorshipRequestDto {
    private UUID id;
    private UUID mentorId;
    private String mentorName;
    private String mentorProfilePicture;
    private UUID menteeId;
    private String menteeName;
    private String menteeProfilePicture;
    private String status;
    private String message;
    private LocalDateTime sessionDate;
    private String feedback;
    private Integer rating;
}
