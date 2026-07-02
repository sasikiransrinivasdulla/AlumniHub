package com.alumnihub.controller;

import com.alumnihub.dto.CommentCreateDto;
import com.alumnihub.dto.CommentDto;
import com.alumnihub.dto.LikeStatusDto;
import com.alumnihub.service.LikeCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LikeCommentController {

    private final LikeCommentService likeCommentService;

    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<LikeStatusDto> toggleLike(Principal principal, @PathVariable UUID postId) {
        LikeStatusDto status = likeCommentService.toggleLike(principal.getName(), postId);
        return ResponseEntity.ok(status);
    }

    @GetMapping("/posts/{postId}/likes/count")
    public ResponseEntity<Integer> getLikesCount(Principal principal, @PathVariable UUID postId) {
        int count = likeCommentService.getLikesCount(principal.getName(), postId);
        return ResponseEntity.ok(count);
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentDto> addComment(Principal principal, @PathVariable UUID postId, @Valid @RequestBody CommentCreateDto commentDto) {
        CommentDto createdComment = likeCommentService.addComment(principal.getName(), postId, commentDto);
        return ResponseEntity.ok(createdComment);
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<org.springframework.data.domain.Page<CommentDto>> getComments(
            Principal principal,
            @PathVariable UUID postId,
            @org.springframework.data.web.PageableDefault(size = 10) org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<CommentDto> comments = likeCommentService.getComments(principal.getName(), postId, pageable);
        return ResponseEntity.ok(comments);
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(Principal principal, @PathVariable UUID commentId) {
        likeCommentService.deleteComment(principal.getName(), commentId);
        return ResponseEntity.ok().build();
    }
}
