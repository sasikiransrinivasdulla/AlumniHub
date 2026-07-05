package com.alumnihub.service;

import com.alumnihub.dto.PostCreateDto;
import com.alumnihub.dto.PostDto;
import com.alumnihub.entity.Post;
import com.alumnihub.entity.User;
import com.alumnihub.repository.PostRepository;
import com.alumnihub.repository.UserRepository;
import com.alumnihub.repository.LikeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final AlumniService alumniService;

    @Transactional
    public PostDto createPost(String email, PostCreateDto createDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        Post post = Post.builder()
                .user(user)
                .imageUrl(createDto.getImageUrl())
                .videoUrl(createDto.getVideoUrl())
                .mediaType(createDto.getMediaType() != null ? createDto.getMediaType() : "IMAGE")
                .caption(createDto.getCaption())
                .likesCount(0)
                .commentsCount(0)
                .build();

        Post savedPost = postRepository.save(post);
        return convertToDto(savedPost, user);
    }

    public Page<PostDto> getFeedForUser(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        String dept = user.getDepartment();
        String batch = user.getBatch();
        String sec = user.getSection();

        Page<Post> postsPage;
        if ("CST".equalsIgnoreCase(dept) || "ECT".equalsIgnoreCase(dept)) {
            postsPage = postRepository.findAllByUserBatchAndUserDepartmentOrderByCreatedAtDesc(batch, dept, pageable);
        } else {
            postsPage = postRepository.findAllByUserBatchAndUserDepartmentAndUserSectionOrderByCreatedAtDesc(batch, dept, sec, pageable);
        }

        List<UUID> postIds = postsPage.getContent().stream().map(Post::getId).collect(Collectors.toList());
        Set<UUID> likedPostIds = postIds.isEmpty() ? Collections.emptySet() 
                : likeRepository.findLikedPostIdsByUserAndPostIds(user, postIds);

        List<PostDto> content = postsPage.getContent().stream()
                .filter(p -> alumniService.hasCompleteProfileAccess(user, p.getUser()))
                .map(p -> convertToDtoWithLikes(p, likedPostIds.contains(p.getId())))
                .collect(Collectors.toList());

        return new org.springframework.data.domain.PageImpl<>(content, pageable, postsPage.getTotalElements());
    }

    public PostDto getPostById(String email, UUID postId) {
        User requestingUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with ID: " + postId));

        User creator = post.getUser();
        if (!alumniService.hasCompleteProfileAccess(requestingUser, creator)) {
            throw new AccessDeniedException("You do not have permission to view this post.");
        }

        return convertToDto(post, requestingUser);
    }

    public PostDto getMemoryOfTheDay(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        String dept = user.getDepartment();
        String batch = user.getBatch();
        String sec = user.getSection();

        List<Post> posts;
        if ("CST".equalsIgnoreCase(dept) || "ECT".equalsIgnoreCase(dept)) {
            posts = postRepository.findAllByBatchAndDeptList(batch, dept);
        } else {
            posts = postRepository.findAllByBatchDeptAndSecList(batch, dept, sec);
        }

        List<Post> visiblePosts = posts.stream()
                .filter(p -> alumniService.hasCompleteProfileAccess(user, p.getUser()))
                .collect(Collectors.toList());

        if (visiblePosts.isEmpty()) {
            return null;
        }

        int daySeed = java.time.LocalDate.now().hashCode();
        int index = Math.abs(daySeed) % visiblePosts.size();
        Post post = visiblePosts.get(index);
        
        return convertToDto(post, user);
    }

    private PostDto convertToDto(Post post, User requestingUser) {
        boolean likedByMe = requestingUser != null && likeRepository.existsByUserAndPost(requestingUser, post);
        return convertToDtoWithLikes(post, likedByMe);
    }

    private PostDto convertToDtoWithLikes(Post post, boolean likedByMe) {
        User creator = post.getUser();
        return PostDto.builder()
                .id(post.getId())
                .userId(creator.getId())
                .userFullName(creator.getFullName())
                .userProfilePicture(creator.getProfilePictureUrl())
                .userCurrentPosition(creator.getCurrentPosition())
                .imageUrl(post.getImageUrl())
                .videoUrl(post.getVideoUrl())
                .mediaType(post.getMediaType())
                .caption(post.getCaption())
                .likesCount(post.getLikesCount())
                .commentsCount(post.getCommentsCount())
                .likedByMe(likedByMe)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
