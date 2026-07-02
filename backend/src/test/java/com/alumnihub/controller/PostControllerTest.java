package com.alumnihub.controller;

import com.alumnihub.dto.PostCreateDto;
import com.alumnihub.entity.Post;
import com.alumnihub.entity.User;
import com.alumnihub.repository.PostRepository;
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

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class PostControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private com.alumnihub.repository.CommentRepository commentRepository;

    @Autowired
    private com.alumnihub.repository.LikeRepository likeRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private User userA; // CSE Batch 2024 Section A
    private User userB; // CSE Batch 2024 Section A (same community)
    private User userC; // CSE Batch 2024 Section B (diff section)
    private User userD; // CST Batch 2024 (diff dept, batch only rule)
    private User userE; // CST Batch 2024 (same community as D)

    private String jwtTokenA;

    @BeforeEach
    void setUp() {
        commentRepository.deleteAll();
        likeRepository.deleteAll();
        postRepository.deleteAll();
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
                .fullName("User B")
                .batch("2020-2024")
                .department("CSE")
                .section("A")
                .role("USER")
                .profileCompleted(true)
                .build());

        userC = userRepository.save(User.builder()
                .firebaseUid("uid-c")
                .email("user.c@gmail.com")
                .fullName("User C")
                .batch("2020-2024")
                .department("CSE")
                .section("B")
                .role("USER")
                .profileCompleted(true)
                .build());

        userD = userRepository.save(User.builder()
                .firebaseUid("uid-d")
                .email("user.d@gmail.com")
                .fullName("User D")
                .batch("2020-2024")
                .department("CST")
                .section("")
                .role("USER")
                .profileCompleted(true)
                .build());

        userE = userRepository.save(User.builder()
                .firebaseUid("uid-e")
                .email("user.e@gmail.com")
                .fullName("User E")
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
        commentRepository.deleteAll();
        likeRepository.deleteAll();
        postRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void testCreatePost_Success() throws Exception {
        PostCreateDto createDto = PostCreateDto.builder()
                .imageUrl("https://example.com/memories.jpg")
                .caption("Graduation Day Memories!")
                .build();

        mockMvc.perform(post("/api/posts")
                .header("Authorization", "Bearer " + jwtTokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caption", is("Graduation Day Memories!")))
                .andExpect(jsonPath("$.imageUrl", is("https://example.com/memories.jpg")))
                .andExpect(jsonPath("$.userFullName", is("User A")))
                .andExpect(jsonPath("$.likesCount", is(0)));

        List<Post> dbPosts = postRepository.findAll();
        assertEquals(1, dbPosts.size());
        assertEquals("Graduation Day Memories!", dbPosts.get(0).getCaption());
    }

    @Test
    void testGetFeed_Success_Filtering() throws Exception {
        // Create posts for different users
        postRepository.save(Post.builder().user(userA).caption("Post A").build());
        postRepository.save(Post.builder().user(userB).caption("Post B").build());
        postRepository.save(Post.builder().user(userC).caption("Post C").build());
        postRepository.save(Post.builder().user(userD).caption("Post D").build());

        // Get feed for User A (CSE, Batch 2024, Section A)
        // Should only see posts from User A and User B (same community)
        mockMvc.perform(get("/api/posts/feed")
                .header("Authorization", "Bearer " + jwtTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].userFullName", is("User B")))
                .andExpect(jsonPath("$[1].userFullName", is("User A")));
    }

    @Test
    void testGetPost_AccessGrantedAndDenied() throws Exception {
        Post postB = postRepository.save(Post.builder().user(userB).caption("Post B").build());
        Post postC = postRepository.save(Post.builder().user(userC).caption("Post C").build());

        // Access User B's post (same community) -> Success
        mockMvc.perform(get("/api/posts/" + postB.getId())
                .header("Authorization", "Bearer " + jwtTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caption", is("Post B")));

        // Access User C's post (different section) -> Forbidden
        mockMvc.perform(get("/api/posts/" + postC.getId())
                .header("Authorization", "Bearer " + jwtTokenA))
                .andExpect(status().isForbidden());
    }
}
