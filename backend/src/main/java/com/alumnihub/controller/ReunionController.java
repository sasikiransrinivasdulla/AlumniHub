package com.alumnihub.controller;

import com.alumnihub.dto.ReunionCollectionDto;
import com.alumnihub.dto.ReunionCommentDto;
import com.alumnihub.dto.ReunionMediaDto;
import com.alumnihub.service.ReunionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reunions")
@RequiredArgsConstructor
public class ReunionController {

    private final ReunionService reunionService;

    @PostMapping
    public ResponseEntity<ReunionCollectionDto> createReunion(
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime date,
            @RequestParam String location
    ) {
        return ResponseEntity.ok(reunionService.createReunion(title, description, date, location));
    }

    @GetMapping
    public ResponseEntity<List<ReunionCollectionDto>> getReunions(Principal principal) {
        return ResponseEntity.ok(reunionService.getReunions(principal.getName()));
    }

    @PostMapping("/{id}/rsvp")
    public ResponseEntity<ReunionCollectionDto> rsvpReunion(Principal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(reunionService.rsvpReunion(principal.getName(), id));
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<ReunionCollectionDto> withdrawReunion(Principal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(reunionService.withdrawReunion(principal.getName(), id));
    }

    @PostMapping("/{id}/media")
    public ResponseEntity<ReunionMediaDto> addMedia(
            Principal principal,
            @PathVariable UUID id,
            @RequestParam String url,
            @RequestParam(defaultValue = "IMAGE") String mediaType,
            @RequestParam(required = false) String caption
    ) {
        return ResponseEntity.ok(reunionService.addMedia(principal.getName(), id, url, mediaType, caption));
    }

    @PostMapping("/{id}/comment")
    public ResponseEntity<ReunionCommentDto> addComment(
            Principal principal,
            @PathVariable UUID id,
            @RequestParam String text
    ) {
        return ResponseEntity.ok(reunionService.addComment(principal.getName(), id, text));
    }
}
