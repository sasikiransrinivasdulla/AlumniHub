package com.alumnihub.controller;

import com.alumnihub.dto.TimelineEntryDto;
import com.alumnihub.service.TimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/timeline")
@RequiredArgsConstructor
public class TimelineController {

    private final TimelineService timelineService;

    @GetMapping("/{userId}")
    public ResponseEntity<List<TimelineEntryDto>> getTimeline(@PathVariable UUID userId) {
        List<TimelineEntryDto> timeline = timelineService.getTimelineForUser(userId);
        return ResponseEntity.ok(timeline);
    }

    @PostMapping
    public ResponseEntity<TimelineEntryDto> addEntry(Principal principal, @RequestBody TimelineEntryDto dto) {
        TimelineEntryDto saved = timelineService.addTimelineEntry(principal.getName(), dto);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{entryId}")
    public ResponseEntity<Void> deleteEntry(Principal principal, @PathVariable UUID entryId) {
        timelineService.deleteTimelineEntry(principal.getName(), entryId);
        return ResponseEntity.ok().build();
    }
}
