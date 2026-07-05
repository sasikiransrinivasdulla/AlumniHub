package com.alumnihub.dto;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

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

    private String currentCompany;

    private String currentCity;

    private String skills;

    private String graduationYear;

    private String privacyLevel;

    @Pattern(regexp = "^$|^[0-9]{10}$", message = "Phone number must be exactly 10 digits")
    private String phoneNumber;

    @Pattern(regexp = "^$|^(https?://)?([a-zA-Z0-9-]+\\.)?linkedin\\.com/.*$", message = "Must be a valid LinkedIn URL")
    private String linkedinUrl;

    @Pattern(regexp = "^$|^(https?://)?(www\\.)?github\\.com/[a-zA-Z0-9_-]+/?$", message = "Must be a valid GitHub URL")
    private String githubUrl;

    @Pattern(regexp = "^$|^(https?://)?(www\\.)?instagram\\.com/[a-zA-Z0-9_.]+/?$", message = "Must be a valid Instagram URL")
    private String instagramUrl;

    private String badges;

    private String openTo;

    // Mentorship fields
    private String mentorSkills;
    private String mentorExperience;
    private String mentorCompany;
    private String mentorAvailability;
    private String mentorMeetingMode;
    private String mentorHelpAreas;

    // Advanced fields
    private String resumeUrl;
    private String portfolioUrl;
    private String websiteUrl;
    private String researchPapers;

    // List properties
    private List<UserExperienceDto> experiences;
    private List<UserEducationDto> educations;
    private List<UserProjectDto> projects;
    private List<UserCertificationDto> certifications;
}
