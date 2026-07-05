package com.alumnihub.service;

import com.alumnihub.dto.*;
import com.alumnihub.entity.*;
import com.alumnihub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserDto getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        return convertToDto(user);
    }

    @Transactional
    public UserDto updateProfile(String email, UserProfileUpdateDto updateDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (updateDto.getFullName() != null) {
            user.setFullName(updateDto.getFullName());
        }
        
        // 4. Branch-based GitHub URL requirement validation
        String dept = updateDto.getDepartment();
        if (dept != null) {
            boolean isSoftwareBranch = "CSE".equalsIgnoreCase(dept) || "CST".equalsIgnoreCase(dept) || "AIML".equalsIgnoreCase(dept) || "CAI".equalsIgnoreCase(dept);
            if (isSoftwareBranch) {
                if (updateDto.getGithubUrl() == null || updateDto.getGithubUrl().trim().isEmpty()) {
                    throw new IllegalArgumentException("GitHub profile URL is required for software-related branches (" + dept + ").");
                }
            }
        }

        user.setBatch(updateDto.getBatch());
        user.setDepartment(updateDto.getDepartment());
        user.setSection(updateDto.getSection());
        user.setBio(updateDto.getBio());
        user.setCurrentPosition(updateDto.getCurrentPosition());
        user.setCurrentCompany(updateDto.getCurrentCompany());
        user.setCurrentCity(updateDto.getCurrentCity());
        user.setSkills(updateDto.getSkills());
        user.setGraduationYear(updateDto.getGraduationYear());
        user.setPrivacyLevel(updateDto.getPrivacyLevel() != null ? updateDto.getPrivacyLevel() : "PUBLIC");
        user.setBadges(updateDto.getBadges());
        user.setOpenTo(updateDto.getOpenTo());
        user.setPhoneNumber(updateDto.getPhoneNumber());
        user.setLinkedinUrl(updateDto.getLinkedinUrl());
        user.setGithubUrl(updateDto.getGithubUrl());
        user.setInstagramUrl(updateDto.getInstagramUrl());

        user.setMentorSkills(updateDto.getMentorSkills());
        user.setMentorExperience(updateDto.getMentorExperience());
        user.setMentorCompany(updateDto.getMentorCompany());
        user.setMentorAvailability(updateDto.getMentorAvailability());
        user.setMentorMeetingMode(updateDto.getMentorMeetingMode());
        user.setMentorHelpAreas(updateDto.getMentorHelpAreas());

        user.setResumeUrl(updateDto.getResumeUrl());
        user.setPortfolioUrl(updateDto.getPortfolioUrl());
        user.setWebsiteUrl(updateDto.getWebsiteUrl());
        user.setResearchPapers(updateDto.getResearchPapers());

        if (updateDto.getExperiences() != null) {
            user.getExperiences().clear();
            for (UserExperienceDto expDto : updateDto.getExperiences()) {
                user.getExperiences().add(UserExperience.builder()
                        .user(user)
                        .title(expDto.getTitle())
                        .company(expDto.getCompany())
                        .location(expDto.getLocation())
                        .startDate(expDto.getStartDate())
                        .endDate(expDto.getEndDate())
                        .currentJob(Boolean.TRUE.equals(expDto.getCurrentJob()))
                        .description(expDto.getDescription())
                        .build());
            }
        }
        if (updateDto.getEducations() != null) {
            user.getEducations().clear();
            for (UserEducationDto eduDto : updateDto.getEducations()) {
                user.getEducations().add(UserEducation.builder()
                        .user(user)
                        .school(eduDto.getSchool())
                        .degree(eduDto.getDegree())
                        .fieldOfStudy(eduDto.getFieldOfStudy())
                        .startDate(eduDto.getStartDate())
                        .endDate(eduDto.getEndDate())
                        .description(eduDto.getDescription())
                        .build());
            }
        }
        if (updateDto.getProjects() != null) {
            user.getProjects().clear();
            for (UserProjectDto projDto : updateDto.getProjects()) {
                user.getProjects().add(UserProject.builder()
                        .user(user)
                        .title(projDto.getTitle())
                        .description(projDto.getDescription())
                        .url(projDto.getUrl())
                        .role(projDto.getRole())
                        .build());
            }
        }
        if (updateDto.getCertifications() != null) {
            user.getCertifications().clear();
            for (UserCertificationDto certDto : updateDto.getCertifications()) {
                user.getCertifications().add(UserCertification.builder()
                        .user(user)
                        .name(certDto.getName())
                        .issuingOrganization(certDto.getIssuingOrganization())
                        .issueDate(certDto.getIssueDate())
                        .expirationDate(certDto.getExpirationDate())
                        .credentialId(certDto.getCredentialId())
                        .credentialUrl(certDto.getCredentialUrl())
                        .build());
            }
        }

        user.setProfileCompleted(true);

        User updatedUser = userRepository.save(user);
        return convertToDto(updatedUser);
    }

    private UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .firebaseUid(user.getFirebaseUid())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .profilePicture(user.getProfilePictureUrl())
                .batch(user.getBatch())
                .department(user.getDepartment())
                .section(user.getSection())
                .bio(user.getBio())
                .currentPosition(user.getCurrentPosition())
                .currentCompany(user.getCurrentCompany())
                .currentCity(user.getCurrentCity())
                .skills(user.getSkills())
                .graduationYear(user.getGraduationYear())
                .privacyLevel(user.getPrivacyLevel())
                .badges(user.getBadges())
                .openTo(user.getOpenTo())
                .phoneNumber(user.getPhoneNumber())
                .linkedinUrl(user.getLinkedinUrl())
                .githubUrl(user.getGithubUrl())
                .instagramUrl(user.getInstagramUrl())
                .profileCompleted(Boolean.TRUE.equals(user.getProfileCompleted()))
                .role(user.getRole())
                
                .mentorSkills(user.getMentorSkills())
                .mentorExperience(user.getMentorExperience())
                .mentorCompany(user.getMentorCompany())
                .mentorAvailability(user.getMentorAvailability())
                .mentorMeetingMode(user.getMentorMeetingMode())
                .mentorHelpAreas(user.getMentorHelpAreas())

                .resumeUrl(user.getResumeUrl())
                .portfolioUrl(user.getPortfolioUrl())
                .websiteUrl(user.getWebsiteUrl())
                .researchPapers(user.getResearchPapers())

                .profileViews(user.getProfileViews())
                .searchAppearances(user.getSearchAppearances())

                .experiences(user.getExperiences().stream().map(e -> UserExperienceDto.builder()
                        .id(e.getId())
                        .title(e.getTitle())
                        .company(e.getCompany())
                        .location(e.getLocation())
                        .startDate(e.getStartDate())
                        .endDate(e.getEndDate())
                        .currentJob(e.getCurrentJob())
                        .description(e.getDescription())
                        .build()).collect(Collectors.toList()))
                
                .educations(user.getEducations().stream().map(e -> UserEducationDto.builder()
                        .id(e.getId())
                        .school(e.getSchool())
                        .degree(e.getDegree())
                        .fieldOfStudy(e.getFieldOfStudy())
                        .startDate(e.getStartDate())
                        .endDate(e.getEndDate())
                        .description(e.getDescription())
                        .build()).collect(Collectors.toList()))

                .projects(user.getProjects().stream().map(p -> UserProjectDto.builder()
                        .id(p.getId())
                        .title(p.getTitle())
                        .description(p.getDescription())
                        .url(p.getUrl())
                        .role(p.getRole())
                        .build()).collect(Collectors.toList()))

                .certifications(user.getCertifications().stream().map(c -> UserCertificationDto.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .issuingOrganization(c.getIssuingOrganization())
                        .issueDate(c.getIssueDate())
                        .expirationDate(c.getExpirationDate())
                        .credentialId(c.getCredentialId())
                        .credentialUrl(c.getCredentialUrl())
                        .build()).collect(Collectors.toList()))

                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
