package com.alumnihub.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EventCreateDto {
    private String title;
    private String description;
    private String bannerUrl;
    private String location;
    private Boolean online;
    private String meetingLink;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer capacity;
}
