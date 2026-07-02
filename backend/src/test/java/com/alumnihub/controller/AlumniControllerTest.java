package com.alumnihub.controller;

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

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AlumniControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private User userA; // CSE Batch 2024 Sec A
    private User userB; // CSE Batch 2024 Sec A (Classmate)
    private User userC; // CSE Batch 2024 Sec B (Diff Section)
    private User userD; // CST Batch 2024 (Diff Department)

    private String jwtTokenA;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        userA = userRepository.save(User.builder()
                .firebaseUid("uid-a")
                .email("user.a@gmail.com")
                .fullName("User A")
                .batch("2020-2024")
                .department("CSE")
                .section("A")
                .role("USER")
                .profileCompleted(true)
                .build());

        userB = userRepository.save(User.builder()
                .firebaseUid("uid-b")
                .email("user.b@gmail.com")
                .fullName("John Doe")
                .batch("2020-2024")
                .department("CSE")
                .section("A")
                .phoneNumber("1234567890")
                .currentPosition("Software Engineer")
                .role("USER")
                .profileCompleted(true)
                .build());

        userC = userRepository.save(User.builder()
                .firebaseUid("uid-c")
                .email("user.c@gmail.com")
                .fullName("Jane Smith")
                .batch("2020-2024")
                .department("CSE")
                .section("B")
                .role("USER")
                .profileCompleted(true)
                .build());

        userD = userRepository.save(User.builder()
                .firebaseUid("uid-d")
                .email("user.d@gmail.com")
                .fullName("Dave Allen")
                .batch("2020-2024")
                .department("CST")
                .section("")
                .role("USER")
                .profileCompleted(true)
                .build());

        jwtTokenA = jwtUtil.generateToken(userA);
    }

    @AfterEach
    void tearDown() {
        userRepository.deleteAll();
    }

    @Test
    void testGetDirectory_Success() throws Exception {
        // User A should only see visible alumni: User A and User B (same community CSE, Batch 2024, Sec A)
        mockMvc.perform(get("/api/alumni")
                .header("Authorization", "Bearer " + jwtTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].fullName", is("User A")))
                .andExpect(jsonPath("$[1].fullName", is("John Doe")));
    }

    @Test
    void testSearchDirectory_Success() throws Exception {
        // Search by Full Name match
        mockMvc.perform(get("/api/alumni/search?q=John")
                .header("Authorization", "Bearer " + jwtTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].fullName", is("John Doe")));

        // Search by Current Position match
        mockMvc.perform(get("/api/alumni/search?q=Software")
                .header("Authorization", "Bearer " + jwtTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].fullName", is("John Doe")));

        // Search returns empty if query matches someone outside the community (e.g. "Smith" in Sec B)
        mockMvc.perform(get("/api/alumni/search?q=Smith")
                .header("Authorization", "Bearer " + jwtTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void testGetAlumniDetails_AccessGrantedAndDenied() throws Exception {
        // Access User B details (same community) -> Success
        mockMvc.perform(get("/api/alumni/" + userB.getId())
                .header("Authorization", "Bearer " + jwtTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName", is("John Doe")))
                .andExpect(jsonPath("$.phoneNumber").exists());

        // Access User C details (different section) -> Forbidden
        mockMvc.perform(get("/api/alumni/" + userC.getId())
                .header("Authorization", "Bearer " + jwtTokenA))
                .andExpect(status().isForbidden());
    }
}
