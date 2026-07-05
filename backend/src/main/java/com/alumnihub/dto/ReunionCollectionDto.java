package com.alumnihub.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ReunionCollectionDto {
    private UUID id;
    private String title;
    private String description;
    private LocalDateTime date;
    private String location;
    private List<ReunionMediaDto> photos;
    private List<ReunionCommentDto> comments;
    private int attendeesCount;
    private boolean attending;
}
