package com.alumnihub.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostCreateDto {
    
    private String imageUrl;
    private String videoUrl;
    private String mediaType;
    
    @NotBlank(message = "Caption must not be blank")
    @jakarta.validation.constraints.Size(max = 1000, message = "Caption must not exceed 1000 characters")
    private String caption;
}
