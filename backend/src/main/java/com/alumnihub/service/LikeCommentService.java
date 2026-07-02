package com.alumnihub.service;

import com.alumnihub.dto.CommentCreateDto;
import com.alumnihub.dto.CommentDto;
import com.alumnihub.dto.LikeStatusDto;
import com.alumnihub.entity.Comment;
import com.alumnihub.entity.Like;
import com.alumnihub.entity.NotificationType;
import com.alumnihub.entity.Post;
import com.alumnihub.entity.User;
import com.alumnihub.repository.CommentRepository;
import com.alumnihub.repository.LikeRepository;
import com.alumnihub.repository.PostRepository;
import com.alumnihub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LikeCommentService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final NotificationService notificationService;

    @Transactional
    public LikeStatusDto toggleLike(String email, UUID postId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        Post post = postRepository.findByIdForUpdate(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with ID: " + postId));

        validateVisibility(user, post);

        Optional<Like> existingLike = likeRepository.findByUserAndPost(user, post);
        boolean liked;
        if (existingLike.isPresent()) {
            Like managedLike = existingLike.get();
            likeRepository.delete(managedLike);
            post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
            liked = false;
        } else {
            Like like = Like.builder()
                    .post(post)
                    .user(user)
                    .build();
            likeRepository.save(like);
            post.setLikesCount(post.getLikesCount() + 1);
            liked = true;
        }
        postRepository.saveAndFlush(post);

        if (liked) {
            notificationService.createNotification(
                    post.getUser(),
                    user,
                    NotificationType.LIKE,
                    post.getId(),
                    user.getFullName() + " liked your memory post."
            );
        }

        return new LikeStatusDto(liked, post.getLikesCount());
    }

    public int getLikesCount(String email, UUID postId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with ID: " + postId));

        validateVisibility(user, post);
        return post.getLikesCount();
    }

    @Transactional
    public CommentDto addComment(String email, UUID postId, CommentCreateDto commentDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with ID: " + postId));

        validateVisibility(user, post);

        String commentVal = commentDto.getComment().trim();
        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .comment(commentVal)
                .build();

        Comment savedComment = commentRepository.save(comment);
        
        post.setCommentsCount(post.getCommentsCount() + 1);
        postRepository.save(post);

        String commentPreview = commentVal.length() > 40 ? commentVal.substring(0, 37) + "..." : commentVal;
        notificationService.createNotification(
                post.getUser(),
                user,
                NotificationType.COMMENT,
                post.getId(),
                user.getFullName() + " commented: \"" + commentPreview + "\""
        );

        return convertToCommentDto(savedComment);
    }

    public Page<CommentDto> getComments(String email, UUID postId, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with ID: " + postId));

        validateVisibility(user, post);

        Page<Comment> commentsPage = commentRepository.findAllByPostOrderByCreatedAtDesc(post, pageable);
        return commentsPage.map(this::convertToCommentDto);
    }

    @Transactional
    public void deleteComment(String email, UUID commentId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found with ID: " + commentId));

        if (!comment.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Only the comment owner may delete their comment.");
        }

        Post post = comment.getPost();
        post.setCommentsCount(Math.max(0, post.getCommentsCount() - 1));
        postRepository.save(post);

        commentRepository.delete(comment);
    }

    private void validateVisibility(User requestingUser, Post post) {
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
    }

    private CommentDto convertToCommentDto(Comment comment) {
        User creator = comment.getUser();
        return CommentDto.builder()
                .id(comment.getId())
                .userId(creator.getId())
                .userFullName(creator.getFullName())
                .userProfilePicture(creator.getProfilePictureUrl())
                .userCurrentPosition(creator.getCurrentPosition())
                .comment(comment.getComment())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
