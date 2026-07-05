package com.alumnihub.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class EventDto {
    private UUID id;
    private String title;
    private String description;
    private String bannerUrl;
    private String location;
    private Boolean online;
    private String meetingLink;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer capacity;
    private UUID organizerId;
    private String organizerName;
    private int participantsCount;
    private boolean participating;
}
