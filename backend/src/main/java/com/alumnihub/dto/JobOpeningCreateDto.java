package com.alumnihub.dto;

import lombok.Data;

@Data
public class JobOpeningCreateDto {
    private String company;
    private String role;
    private String location;
    private String category;
    private String description;
    private String requirements;
    private String externalLink;
}
