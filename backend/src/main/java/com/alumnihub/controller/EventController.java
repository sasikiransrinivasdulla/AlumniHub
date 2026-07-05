package com.alumnihub.controller;

import com.alumnihub.dto.EventCreateDto;
import com.alumnihub.dto.EventDto;
import com.alumnihub.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    public ResponseEntity<EventDto> createEvent(Principal principal, @RequestBody EventCreateDto createDto) {
        return ResponseEntity.ok(eventService.createEvent(principal.getName(), createDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventDto> updateEvent(Principal principal, @PathVariable UUID id, @RequestBody EventCreateDto createDto) {
        return ResponseEntity.ok(eventService.updateEvent(principal.getName(), id, createDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(Principal principal, @PathVariable UUID id) {
        eventService.deleteEvent(principal.getName(), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/rsvp")
    public ResponseEntity<EventDto> rsvpEvent(Principal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(eventService.rsvpEvent(principal.getName(), id));
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<EventDto> withdrawRsvp(Principal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(eventService.withdrawRsvp(principal.getName(), id));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<EventDto>> getUpcomingEvents(Principal principal) {
        return ResponseEntity.ok(eventService.getUpcomingEvents(principal.getName()));
    }

    @GetMapping("/past")
    public ResponseEntity<List<EventDto>> getPastEvents(Principal principal) {
        return ResponseEntity.ok(eventService.getPastEvents(principal.getName()));
    }

    @GetMapping("/popular")
    public ResponseEntity<List<EventDto>> getPopularEvents(Principal principal) {
        return ResponseEntity.ok(eventService.getPopularEvents(principal.getName()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<EventDto>> getMyEvents(Principal principal) {
        return ResponseEntity.ok(eventService.getMyEvents(principal.getName()));
    }
}
