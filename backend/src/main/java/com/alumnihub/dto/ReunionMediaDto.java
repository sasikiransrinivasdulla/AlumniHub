package com.alumnihub.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class ReunionMediaDto {
    private UUID id;
    private String url;
    private String mediaType;
    private String caption;
    private UUID creatorId;
    private String creatorName;
}
