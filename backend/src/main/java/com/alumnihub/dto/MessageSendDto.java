package com.alumnihub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageSendDto {
    @Size(max = 2000, message = "Message must not exceed 2000 characters")
    private String text;
    private String imageUrl;
}
