package com.alumnihub.controller;

import com.alumnihub.dto.UserProfileUpdateDto;
import com.alumnihub.entity.User;
import com.alumnihub.repository.UserRepository;
import com.alumnihub.security.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private String jwtToken;

    @BeforeEach
    void setUp() {
        // Ensure clean state and persist a test user
        userRepository.findByEmail("profile.test@gmail.com").ifPresent(userRepository::delete);

        testUser = User.builder()
                .firebaseUid("firebase-test-profile-123")
                .email("profile.test@gmail.com")
                .fullName("Profile Test User")
                .profilePicture("http://example.com/profile.jpg")
                .role("USER")
                .profileCompleted(false)
                .build();

        testUser = userRepository.save(testUser);
        jwtToken = jwtUtil.generateToken(testUser);
    }

    @AfterEach
    void tearDown() {
        userRepository.findByEmail("profile.test@gmail.com").ifPresent(userRepository::delete);
    }

    @Test
    void testGetProfile_Success() throws Exception {
        mockMvc.perform(get("/api/user/me")
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("profile.test@gmail.com")))
                .andExpect(jsonPath("$.fullName", is("Profile Test User")))
                .andExpect(jsonPath("$.profilePicture", is("http://example.com/profile.jpg")))
                .andExpect(jsonPath("$.profileCompleted", is(false)))
                .andExpect(jsonPath("$.role", is("USER")));
    }

    @Test
    void testGetProfile_Unauthenticated() throws Exception {
        mockMvc.perform(get("/api/user/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdateProfile_Success() throws Exception {
        UserProfileUpdateDto updateDto = UserProfileUpdateDto.builder()
                .fullName("Updated Full Name")
                .batch("2020-2024")
                .department("CSE")
                .section("A")
                .bio("This is a verified test bio.")
                .currentPosition("Lead Engineer")
                .phoneNumber("9876543210")
                .linkedinUrl("https://linkedin.com/in/test-user")
                .githubUrl("https://github.com/test-user")
                .build();

        mockMvc.perform(put("/api/user/me")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName", is("Updated Full Name")))
                .andExpect(jsonPath("$.batch", is("2020-2024")))
                .andExpect(jsonPath("$.department", is("CSE")))
                .andExpect(jsonPath("$.section", is("A")))
                .andExpect(jsonPath("$.bio", is("This is a verified test bio.")))
                .andExpect(jsonPath("$.currentPosition", is("Lead Engineer")))
                .andExpect(jsonPath("$.phoneNumber", is("9876543210")))
                .andExpect(jsonPath("$.linkedinUrl", is("https://linkedin.com/in/test-user")))
                .andExpect(jsonPath("$.githubUrl", is("https://github.com/test-user")))
                .andExpect(jsonPath("$.profileCompleted", is(true)));

        // Verify changes are in database
        Optional<User> updatedUserOpt = userRepository.findByEmail("profile.test@gmail.com");
        assertTrue(updatedUserOpt.isPresent());
        User dbUser = updatedUserOpt.get();
        assertEquals("Updated Full Name", dbUser.getFullName());
        assertEquals("2020-2024", dbUser.getBatch());
        assertEquals("9876543210", dbUser.getPhoneNumber());
        assertTrue(Boolean.TRUE.equals(dbUser.getProfileCompleted()));
    }


    @Test
    void testUpdateProfile_ValidationFailure_BioLength() throws Exception {
        // Bio exceeds 250 characters
        String longBio = "a".repeat(251);
        UserProfileUpdateDto updateDto = UserProfileUpdateDto.builder()
                .bio(longBio)
                .phoneNumber("1234567890")
                .build();

        mockMvc.perform(put("/api/user/me")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testUpdateProfile_ValidationFailure_PhoneNumberFormat() throws Exception {
        // Invalid phone number format (contains letters, or not 10 digits)
        UserProfileUpdateDto updateDto = UserProfileUpdateDto.builder()
                .phoneNumber("123abc4567")
                .build();

        mockMvc.perform(put("/api/user/me")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testUpdateProfile_ValidationFailure_LinkedInUrl() throws Exception {
        UserProfileUpdateDto updateDto = UserProfileUpdateDto.builder()
                .phoneNumber("1234567890")
                .linkedinUrl("not-a-valid-linkedin-link")
                .build();

        mockMvc.perform(put("/api/user/me")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testUpdateProfile_ValidationFailure_GitHubUrl() throws Exception {
        UserProfileUpdateDto updateDto = UserProfileUpdateDto.builder()
                .phoneNumber("1234567890")
                .githubUrl("not-a-valid-github-link")
                .build();

        mockMvc.perform(put("/api/user/me")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isBadRequest());
    }
}
