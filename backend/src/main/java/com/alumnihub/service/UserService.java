package com.alumnihub.service;

import com.alumnihub.dto.UserDto;
import com.alumnihub.dto.UserProfileUpdateDto;
import com.alumnihub.entity.User;
import com.alumnihub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        user.setPhoneNumber(updateDto.getPhoneNumber());
        user.setLinkedinUrl(updateDto.getLinkedinUrl());
        user.setGithubUrl(updateDto.getGithubUrl());
        user.setInstagramUrl(updateDto.getInstagramUrl());
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
                .profilePicture(user.getProfilePicture())
                .batch(user.getBatch())
                .department(user.getDepartment())
                .section(user.getSection())
                .bio(user.getBio())
                .currentPosition(user.getCurrentPosition())
                .phoneNumber(user.getPhoneNumber())
                .linkedinUrl(user.getLinkedinUrl())
                .githubUrl(user.getGithubUrl())
                .instagramUrl(user.getInstagramUrl())
                .profileCompleted(Boolean.TRUE.equals(user.getProfileCompleted()))
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
