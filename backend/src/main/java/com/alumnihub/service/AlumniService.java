package com.alumnihub.service;

import com.alumnihub.dto.UserDto;
import com.alumnihub.entity.User;
import com.alumnihub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AlumniService {

    private final UserRepository userRepository;

    public List<UserDto> getVisibleAlumni(String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + requesterEmail));

        String batch = requester.getBatch();
        String dept = requester.getDepartment();
        String sec = requester.getSection();

        List<User> alumni;
        if ("CST".equalsIgnoreCase(dept) || "ECT".equalsIgnoreCase(dept)) {
            alumni = userRepository.findAllByBatchAndDepartmentAndProfileCompletedTrue(batch, dept);
        } else {
            alumni = userRepository.findAllByBatchAndDepartmentAndSectionAndProfileCompletedTrue(batch, dept, sec);
        }

        return alumni.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public List<UserDto> searchVisibleAlumni(String requesterEmail, String query) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + requesterEmail));

        String batch = requester.getBatch();
        String dept = requester.getDepartment();
        String sec = requester.getSection();

        String trimmedQuery = query == null ? "" : query.trim();

        List<User> alumni;
        if ("CST".equalsIgnoreCase(dept) || "ECT".equalsIgnoreCase(dept)) {
            alumni = userRepository.searchCstEctAlumni(batch, dept, trimmedQuery);
        } else {
            alumni = userRepository.searchOtherAlumni(batch, dept, sec, trimmedQuery);
        }

        return alumni.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public UserDto getAlumniDetailsById(String requesterEmail, UUID targetId) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + requesterEmail));

        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new IllegalArgumentException("Alumni not found with ID: " + targetId));

        // Enforce community visibility rules
        boolean isVisible = false;
        String targetDept = target.getDepartment();
        if ("CST".equalsIgnoreCase(targetDept) || "ECT".equalsIgnoreCase(targetDept)) {
            isVisible = target.getBatch().equalsIgnoreCase(requester.getBatch()) &&
                        targetDept.equalsIgnoreCase(requester.getDepartment());
        } else {
            isVisible = target.getBatch().equalsIgnoreCase(requester.getBatch()) &&
                        targetDept.equalsIgnoreCase(requester.getDepartment()) &&
                        (target.getSection() != null && target.getSection().equalsIgnoreCase(requester.getSection()));
        }

        if (!isVisible) {
            throw new AccessDeniedException("You do not belong to the academic community authorized to view this profile.");
        }

        return convertToDto(target);
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
                .phoneNumber(user.getPhoneNumber())
                .linkedinUrl(user.getLinkedinUrl())
                .githubUrl(user.getGithubUrl())
                .instagramUrl(user.getInstagramUrl())
                .profileCompleted(user.getProfileCompleted())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
