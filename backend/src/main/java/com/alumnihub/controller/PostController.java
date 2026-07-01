package com.alumnihub.controller;

import com.alumnihub.dto.PostCreateDto;
import com.alumnihub.dto.PostDto;
import com.alumnihub.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<PostDto> createPost(Principal principal, @Valid @RequestBody PostCreateDto createDto) {
        PostDto postDto = postService.createPost(principal.getName(), createDto);
        return ResponseEntity.ok(postDto);
    }

    @GetMapping("/feed")
    public ResponseEntity<List<PostDto>> getFeed(Principal principal) {
        List<PostDto> feed = postService.getFeedForUser(principal.getName());
        return ResponseEntity.ok(feed);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDto> getPost(Principal principal, @PathVariable UUID id) {
        PostDto postDto = postService.getPostById(principal.getName(), id);
        return ResponseEntity.ok(postDto);
    }
}
