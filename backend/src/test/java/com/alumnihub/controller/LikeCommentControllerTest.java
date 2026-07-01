package com.alumnihub.controller;

import com.alumnihub.dto.CommentCreateDto;
import com.alumnihub.entity.Comment;
import com.alumnihub.entity.Post;
import com.alumnihub.entity.User;
import com.alumnihub.repository.CommentRepository;
import com.alumnihub.repository.LikeRepository;
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

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class LikeCommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private User userA; // CSE Batch 2024 Sec A
    private User userB; // CSE Batch 2024 Sec A
    private User userC; // CSE Batch 2024 Sec B

    private Post postB; // User B's post
    private Post postC; // User C's post

    private String jwtTokenA;
    private String jwtTokenB;

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

        postB = postRepository.save(Post.builder().user(userB).caption("Post B").build());
        postC = postRepository.save(Post.builder().user(userC).caption("Post C").build());

        jwtTokenA = jwtUtil.generateToken(userA);
        jwtTokenB = jwtUtil.generateToken(userB);
    }

    @AfterEach
    void tearDown() {
        commentRepository.deleteAll();
        likeRepository.deleteAll();
        postRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void testToggleLike_Success() throws Exception {
        // Toggle Like (Add Like)
        mockMvc.perform(post("/api/posts/" + postB.getId() + "/like")
                .header("Authorization", "Bearer " + jwtTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked", is(true)))
                .andExpect(jsonPath("$.likesCount", is(1)));

        assertTrue(likeRepository.existsByPostAndUser(postB, userA));

        // Toggle Like (Remove Like)
        mockMvc.perform(post("/api/posts/" + postB.getId() + "/like")
                .header("Authorization", "Bearer " + jwtTokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked", is(false)))
                .andExpect(jsonPath("$.likesCount", is(0)));

        assertFalse(likeRepository.existsByPostAndUser(postB, userA));
    }

    @Test
    void testToggleLike_Forbidden() throws Exception {
        // Post C belongs to User C (CSE Batch 2024 Sec B) which is NOT in User A's community (Sec A)
        mockMvc.perform(post("/api/posts/" + postC.getId() + "/like")
                .header("Authorization", "Bearer " + jwtTokenA))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAddComment_SuccessAndValidationError() throws Exception {
        CommentCreateDto commentDto = CommentCreateDto.builder()
                .comment("Excellent memories, User B!")
                .build();

        mockMvc.perform(post("/api/posts/" + postB.getId() + "/comments")
                .header("Authorization", "Bearer " + jwtTokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(commentDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.comment", is("Excellent memories, User B!")))
                .andExpect(jsonPath("$.userFullName", is("User A")));

        // Empty Comment validation
        CommentCreateDto emptyDto = CommentCreateDto.builder().comment("").build();
        mockMvc.perform(post("/api/posts/" + postB.getId() + "/comments")
                .header("Authorization", "Bearer " + jwtTokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emptyDto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testAddComment_Forbidden() throws Exception {
        CommentCreateDto commentDto = CommentCreateDto.builder().comment("Hello").build();
        mockMvc.perform(post("/api/posts/" + postC.getId() + "/comments")
                .header("Authorization", "Bearer " + jwtTokenA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(commentDto)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testDeleteComment_SuccessAndDenied() throws Exception {
        Comment comment = commentRepository.save(Comment.builder()
                .post(postB)
                .user(userB)
                .comment("User B self comment")
                .build());

        // User A tries to delete User B's comment -> Forbidden
        mockMvc.perform(delete("/api/comments/" + comment.getId())
                .header("Authorization", "Bearer " + jwtTokenA))
                .andExpect(status().isForbidden());

        // User B deletes own comment -> Success
        mockMvc.perform(delete("/api/comments/" + comment.getId())
                .header("Authorization", "Bearer " + jwtTokenB))
                .andExpect(status().isOk());
    }
}
