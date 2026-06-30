package com.alumnihub.controller;

import com.alumnihub.dto.AuthRequest;
import com.alumnihub.entity.User;
import com.alumnihub.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private MockedStatic<FirebaseAuth> mockedFirebaseAuth;
    private FirebaseAuth mockAuthInstance;

    @BeforeEach
    void setUp() {
        mockedFirebaseAuth = Mockito.mockStatic(FirebaseAuth.class);
        mockAuthInstance = mock(FirebaseAuth.class);
        mockedFirebaseAuth.when(FirebaseAuth::getInstance).thenReturn(mockAuthInstance);
    }

    @AfterEach
    void tearDown() {
        mockedFirebaseAuth.close();
        // Clean up database entries created during the test
        userRepository.findByEmail("testuser@gmail.com").ifPresent(userRepository::delete);
    }

    @Test
    void testGoogleAuthentication_NewUser_CreatesUserAndReturnsJwt() throws Exception {
        String testFirebaseToken = "mock-firebase-token";
        
        // Mock Firebase token verification response
        FirebaseToken mockDecodedToken = mock(FirebaseToken.class);
        when(mockDecodedToken.getUid()).thenReturn("firebase-uid-12345");
        when(mockDecodedToken.getEmail()).thenReturn("testuser@gmail.com");
        when(mockDecodedToken.getName()).thenReturn("Test User");
        when(mockDecodedToken.getPicture()).thenReturn("http://example.com/pic.jpg");

        when(mockAuthInstance.verifyIdToken(testFirebaseToken)).thenReturn(mockDecodedToken);

        AuthRequest request = new AuthRequest(testFirebaseToken);

        // Perform request to the Auth Controller
        mockMvc.perform(post("/api/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.authStatus", is("PENDING_ONBOARDING")))
                .andExpect(jsonPath("$.user.email", is("testuser@gmail.com")))
                .andExpect(jsonPath("$.user.fullName", is("Test User")))
                .andExpect(jsonPath("$.user.firebaseUid", is("firebase-uid-12345")));

        // Verify Database insertion
        Optional<User> savedUserOpt = userRepository.findByEmail("testuser@gmail.com");
        assertTrue(savedUserOpt.isPresent());
        User savedUser = savedUserOpt.get();
        assertTrue(savedUser.getFirebaseUid().equals("firebase-uid-12345"));
        assertTrue(savedUser.getRole().equals("USER"));
    }
}
