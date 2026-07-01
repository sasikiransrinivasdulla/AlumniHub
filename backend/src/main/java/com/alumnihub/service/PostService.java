package com.alumnihub.service;

import com.alumnihub.dto.PostCreateDto;
import com.alumnihub.dto.PostDto;
import com.alumnihub.entity.Post;
import com.alumnihub.entity.User;
import com.alumnihub.repository.PostRepository;
import com.alumnihub.repository.UserRepository;
import com.alumnihub.repository.LikeRepository;
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
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final LikeRepository likeRepository;

    @Transactional
    public PostDto createPost(String email, PostCreateDto createDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        Post post = Post.builder()
                .user(user)
                .imageUrl(createDto.getImageUrl())
                .caption(createDto.getCaption())
                .likesCount(0)
                .commentsCount(0)
                .build();

        Post savedPost = postRepository.save(post);
        return convertToDto(savedPost, user);
    }

    public List<PostDto> getFeedForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        String dept = user.getDepartment();
        String batch = user.getBatch();
        String sec = user.getSection();

        List<Post> posts;
        if ("CST".equalsIgnoreCase(dept) || "ECT".equalsIgnoreCase(dept)) {
            posts = postRepository.findAllByUserBatchAndUserDepartmentOrderByCreatedAtDesc(batch, dept);
        } else {
            posts = postRepository.findAllByUserBatchAndUserDepartmentAndUserSectionOrderByCreatedAtDesc(batch, dept, sec);
        }

        return posts.stream().map(p -> convertToDto(p, user)).collect(Collectors.toList());
    }

    public PostDto getPostById(String email, UUID postId) {
        User requestingUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with ID: " + postId));

        // Visibility restriction check
        User creator = post.getUser();
        String creatorDept = creator.getDepartment();
        
        boolean hasAccess = false;
        if ("CST".equalsIgnoreCase(creatorDept) || "ECT".equalsIgnoreCase(creatorDept)) {
            hasAccess = creator.getBatch().equalsIgnoreCase(requestingUser.getBatch()) &&
                        creatorDept.equalsIgnoreCase(requestingUser.getDepartment());
        } else {
            hasAccess = creator.getBatch().equalsIgnoreCase(requestingUser.getBatch()) &&
                        creatorDept.equalsIgnoreCase(requestingUser.getDepartment()) &&
                        (creator.getSection() != null && creator.getSection().equalsIgnoreCase(requestingUser.getSection()));
        }

        if (!hasAccess) {
            throw new AccessDeniedException("You do not belong to the academic community authorized to view this post.");
        }

        return convertToDto(post, requestingUser);
    }

    private PostDto convertToDto(Post post, User requestingUser) {
        User creator = post.getUser();
        boolean likedByMe = requestingUser != null && likeRepository.existsByPostAndUser(post, requestingUser);

        return PostDto.builder()
                .id(post.getId())
                .userId(creator.getId())
                .userFullName(creator.getFullName())
                .userProfilePicture(creator.getProfilePicture())
                .userCurrentPosition(creator.getCurrentPosition())
                .imageUrl(post.getImageUrl())
                .caption(post.getCaption())
                .likesCount(post.getLikesCount())
                .commentsCount(post.getCommentsCount())
                .likedByMe(likedByMe)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
