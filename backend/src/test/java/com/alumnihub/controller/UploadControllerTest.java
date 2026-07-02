package com.alumnihub.controller;

import com.alumnihub.entity.User;
import com.alumnihub.repository.UserRepository;
import com.alumnihub.security.JwtUtil;
import com.alumnihub.service.CloudinaryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class UploadControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @MockBean
    private CloudinaryService cloudinaryService;

    private User user;
    private String jwtToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        user = userRepository.save(User.builder()
                .firebaseUid("uid-upload-user")
                .email("uploader@gmail.com")
                .fullName("Upload User")
                .role("USER")
                .profileCompleted(true)
                .build());

        jwtToken = jwtUtil.generateToken(user);
    }

    @AfterEach
    void tearDown() {
        userRepository.deleteAll();
    }

    @Test
    void testUploadProfileImage_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.png",
                "image/png",
                "some-binary-data".getBytes()
        );

        Mockito.when(cloudinaryService.uploadFile(any(), eq("alumni-hub/profile")))
                .thenReturn(Map.of("secure_url", "https://res.cloudinary.com/demo/image/upload/v123/alumni-hub/profile/avatar.png"));

        mockMvc.perform(multipart("/api/upload/profile-image")
                .file(file)
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profilePicture", is("https://res.cloudinary.com/demo/image/upload/v123/alumni-hub/profile/avatar.png")));

        // Verify database state
        Optional<User> updatedUserOpt = userRepository.findByEmail("uploader@gmail.com");
        assertTrue(updatedUserOpt.isPresent());
        is(updatedUserOpt.get().getProfilePictureUrl()).matches("https://res.cloudinary.com/demo/image/upload/v123/alumni-hub/profile/avatar.png");
    }

    @Test
    void testUploadProfileImage_FormatNotSupported() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "resume.pdf",
                "application/pdf",
                "pdf-data".getBytes()
        );

        mockMvc.perform(multipart("/api/upload/profile-image")
                .file(file)
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$", is("Unsupported file format. Only JPG, JPEG, PNG, and WEBP are allowed.")));
    }

    @Test
    void testUploadProfileImage_FileExceedsLimit() throws Exception {
        // Create dummy data slightly over 10 MB limit
        byte[] oversizedData = new byte[10 * 1024 * 1024 + 1024];
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "large.png",
                "image/png",
                oversizedData
        );

        mockMvc.perform(multipart("/api/upload/profile-image")
                .file(file)
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$", is("File size exceeds the maximum limit of 10 MB.")));
    }

    @Test
    void testDeleteProfileImage_Success() throws Exception {
        // Pre-save user with profile picture
        user.setProfilePictureUrl("https://res.cloudinary.com/demo/image/upload/v123/alumni-hub/profile/avatar.png");
        userRepository.save(user);

        Mockito.when(cloudinaryService.extractPublicId(any())).thenReturn("alumni-hub/profile/avatar");
        Mockito.when(cloudinaryService.deleteFile("alumni-hub/profile/avatar")).thenReturn(Map.of("result", "ok"));

        mockMvc.perform(delete("/api/upload/profile-image")
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profilePicture").doesNotExist());

        Optional<User> updatedUserOpt = userRepository.findByEmail("uploader@gmail.com");
        assertTrue(updatedUserOpt.isPresent());
        assertNull(updatedUserOpt.get().getProfilePictureUrl());
    }

    @Test
    void testUploadPostImage_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "post.webp",
                "image/webp",
                "post-binary-data".getBytes()
        );

        Mockito.when(cloudinaryService.uploadFile(any(), eq("alumni-hub/posts")))
                .thenReturn(Map.of("secure_url", "https://res.cloudinary.com/demo/image/upload/v123/alumni-hub/posts/post.webp"));

        mockMvc.perform(multipart("/api/upload/post-image")
                .file(file)
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url", is("https://res.cloudinary.com/demo/image/upload/v123/alumni-hub/posts/post.webp")));
    }
}
