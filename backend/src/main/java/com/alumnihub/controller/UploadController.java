package com.alumnihub.controller;

import com.alumnihub.dto.UserDto;
import com.alumnihub.entity.User;
import com.alumnihub.repository.UserRepository;
import com.alumnihub.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Slf4j
public class UploadController {

    private final CloudinaryService cloudinaryService;
    private final UserRepository userRepository;

    @PostMapping("/profile-image")
    public ResponseEntity<?> uploadProfileImage(Principal principal, @RequestParam("file") MultipartFile file) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required.");
        }

        try {
            validateImageFile(file);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

        try {
            User user = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + principal.getName()));

            // Delete old Cloudinary profile picture if it exists
            String oldUrl = user.getProfilePictureUrl();
            if (oldUrl != null && oldUrl.contains("cloudinary.com")) {
                String oldPublicId = cloudinaryService.extractPublicId(oldUrl);
                if (oldPublicId != null) {
                    try {
                        cloudinaryService.deleteFile(oldPublicId);
                    } catch (Exception e) {
                        log.error("Failed to delete old profile picture from Cloudinary: {}", oldPublicId, e);
                    }
                }
            }

            // Upload new profile picture
            Map uploadResult = cloudinaryService.uploadFile(file, "alumni-hub/profile");
            String secureUrl = (String) uploadResult.get("secure_url");

            user.setProfilePictureUrl(secureUrl);
            User updatedUser = userRepository.save(user);

            return ResponseEntity.ok(convertToDto(updatedUser));
        } catch (IOException e) {
            log.error("Failed to upload profile picture to Cloudinary", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Image upload failed.");
        }
    }

    @DeleteMapping("/profile-image")
    public ResponseEntity<?> deleteProfileImage(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required.");
        }

        try {
            User user = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + principal.getName()));

            String oldUrl = user.getProfilePictureUrl();
            if (oldUrl != null && oldUrl.contains("cloudinary.com")) {
                String oldPublicId = cloudinaryService.extractPublicId(oldUrl);
                if (oldPublicId != null) {
                    try {
                        cloudinaryService.deleteFile(oldPublicId);
                    } catch (Exception e) {
                        log.error("Failed to delete profile picture from Cloudinary: {}", oldPublicId, e);
                    }
                }
            }

            user.setProfilePictureUrl(null);
            User updatedUser = userRepository.save(user);

            return ResponseEntity.ok(convertToDto(updatedUser));
        } catch (Exception e) {
            log.error("Failed to delete profile picture", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete profile picture.");
        }
    }

    @PostMapping("/post-image")
    public ResponseEntity<?> uploadPostImage(Principal principal, @RequestParam("file") MultipartFile file) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required.");
        }

        try {
            validateImageFile(file);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

        try {
            Map uploadResult = cloudinaryService.uploadFile(file, "alumni-hub/posts");
            String secureUrl = (String) uploadResult.get("secure_url");
            return ResponseEntity.ok(Map.of("url", secureUrl));
        } catch (IOException e) {
            log.error("Failed to upload post image to Cloudinary", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Post image upload failed.");
        }
    }

    @PostMapping("/post-video")
    public ResponseEntity<?> uploadPostVideo(Principal principal, @RequestParam("file") MultipartFile file) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required.");
        }

        try {
            validateVideoFile(file);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

        try {
            Map uploadResult = cloudinaryService.uploadFile(file, "alumni-hub/posts");
            String secureUrl = (String) uploadResult.get("secure_url");
            return ResponseEntity.ok(Map.of("url", secureUrl));
        } catch (IOException e) {
            log.error("Failed to upload post video to Cloudinary", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Post video upload failed.");
        }
    }

    private void validateVideoFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Upload file cannot be empty.");
        }

        // Validate File Size (30 MB maximum)
        if (file.getSize() > 30 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds the maximum limit of 30 MB.");
        }

        // Validate Content Type (MP4, MOV, WEBM)
        String contentType = file.getContentType();
        if (contentType == null || 
                (!contentType.equalsIgnoreCase("video/mp4") && 
                 !contentType.equalsIgnoreCase("video/quicktime") && 
                 !contentType.equalsIgnoreCase("video/webm"))) {
            throw new IllegalArgumentException("Unsupported file format. Only MP4, MOV, and WEBM are allowed.");
        }
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Upload file cannot be empty.");
        }

        // Validate File Size (10 MB maximum)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds the maximum limit of 10 MB.");
        }

        // Validate Content Type (JPG, JPEG, PNG, WEBP)
        String contentType = file.getContentType();
        if (contentType == null || 
                (!contentType.equalsIgnoreCase("image/jpeg") && 
                 !contentType.equalsIgnoreCase("image/jpg") && 
                 !contentType.equalsIgnoreCase("image/png") && 
                 !contentType.equalsIgnoreCase("image/webp"))) {
            throw new IllegalArgumentException("Unsupported file format. Only JPG, JPEG, PNG, and WEBP are allowed.");
        }
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
