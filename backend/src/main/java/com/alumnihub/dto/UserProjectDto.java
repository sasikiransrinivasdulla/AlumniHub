package com.alumnihub.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class UserProjectDto {
    private UUID id;
    private String title;
    private String description;
    private String url;
    private String role;
}
