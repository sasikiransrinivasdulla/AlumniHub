package com.alumnihub.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class JobOpeningDto {
    private UUID id;
    private String company;
    private String role;
    private String location;
    private String category;
    private String description;
    private String requirements;
    private String externalLink;
    private UUID creatorId;
    private String creatorName;
    private boolean saved;
}
