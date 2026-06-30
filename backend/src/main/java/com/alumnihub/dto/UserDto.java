package com.alumnihub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private UUID id;
    private String firebaseUid;
    private String email;
    private String fullName;
    private String profilePicture;
    private String batch;
    private String department;
    private String section;
    private String bio;
    private String currentPosition;
    private String phoneNumber;
    private String linkedinUrl;
    private String githubUrl;
    private Boolean profileCompleted;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
