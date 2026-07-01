package com.alumnihub.dto;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileUpdateDto {

    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    private String batch;

    private String department;

    private String section;

    @Size(max = 250, message = "Bio must not exceed 250 characters")
    private String bio;

    @Size(max = 100, message = "Current position must not exceed 100 characters")
    private String currentPosition;

    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be exactly 10 digits")
    private String phoneNumber;

    @Pattern(regexp = "^$|^(https?://)?([a-zA-Z0-9-]+\\.)?linkedin\\.com/.*$", message = "Must be a valid LinkedIn URL")
    private String linkedinUrl;

    @Pattern(regexp = "^$|^(https?://)?(www\\.)?github\\.com/[a-zA-Z0-9_-]+/?$", message = "Must be a valid GitHub URL")
    private String githubUrl;

    @Pattern(regexp = "^$|^(https?://)?(www\\.)?instagram\\.com/[a-zA-Z0-9_.]+/?$", message = "Must be a valid Instagram URL")
    private String instagramUrl;

}
