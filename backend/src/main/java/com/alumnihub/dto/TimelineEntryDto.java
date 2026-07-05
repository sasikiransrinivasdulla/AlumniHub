package com.alumnihub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimelineEntryDto {
    private UUID id;
    private UUID userId;
    private Integer year;
    private String title;
    private String description;
}
