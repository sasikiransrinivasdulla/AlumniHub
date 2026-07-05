package com.alumnihub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
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
    private String currentCompany;
    private String currentCity;
    private String skills;
    private String graduationYear;
    private String privacyLevel;
    private String inTouchStatus;
    private LocalDateTime inTouchConnectedSince;
    private String contactRequestStatus;
    private Boolean hasFullAccess;
    private String phoneNumber;
    private String linkedinUrl;
    private String githubUrl;
    private String instagramUrl;
    private Boolean profileCompleted;
    private String role;
    private String badges;
    private String openTo;
    private String recommendationReason;

    // Mentorship specific profile settings
    private String mentorSkills;
    private String mentorExperience;
    private String mentorCompany;
    private String mentorAvailability;
    private String mentorMeetingMode;
    private String mentorHelpAreas;

    // Advanced profile info
    private String resumeUrl;
    private String portfolioUrl;
    private String websiteUrl;
    private String researchPapers;

    private Long profileViews;
    private Long searchAppearances;

    // Professional & academic history lists
    private List<UserExperienceDto> experiences;
    private List<UserEducationDto> educations;
    private List<UserProjectDto> projects;
    private List<UserCertificationDto> certifications;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
