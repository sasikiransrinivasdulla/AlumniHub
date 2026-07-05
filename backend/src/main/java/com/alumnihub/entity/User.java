package com.alumnihub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(nullable = false, unique = true)
    private String firebaseUid;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String fullName;

    private String profilePictureUrl;

    private String batch;

    private String department;

    private String section;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String currentPosition;

    private String currentCompany;

    private String currentCity;

    private String skills;

    private String graduationYear;

    @Builder.Default
    private String privacyLevel = "PUBLIC";

    private String phoneNumber;

    private String linkedinUrl;

    private String githubUrl;

    private String instagramUrl;

    @Builder.Default
    private Boolean profileCompleted = false;

    private String badges;

    private String openTo;

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
    @Column(columnDefinition = "TEXT")
    private String researchPapers;

    // View analytics counters
    @Builder.Default
    private Long profileViews = 0L;

    @Builder.Default
    private Long searchAppearances = 0L;

    // Relations to educational & professional sub-records
    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserExperience> experiences = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserEducation> educations = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserProject> projects = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserCertification> certifications = new ArrayList<>();

    @Column(nullable = false)
    private String role; // e.g. "USER", "ADMIN"

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
