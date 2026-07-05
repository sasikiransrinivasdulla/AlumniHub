package com.alumnihub.controller;

import com.alumnihub.dto.MentorshipRequestCreateDto;
import com.alumnihub.dto.MentorshipRequestDto;
import com.alumnihub.entity.User;
import com.alumnihub.service.MentorshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/mentorship")
@RequiredArgsConstructor
public class MentorshipController {

    private final MentorshipService mentorshipService;

    @PostMapping("/register")
    public ResponseEntity<Void> registerAsMentor(
            Principal principal,
            @RequestParam String skills,
            @RequestParam String experience,
            @RequestParam String company,
            @RequestParam String availability,
            @RequestParam String meetingMode,
            @RequestParam String helpAreas
    ) {
        mentorshipService.registerAsMentor(principal.getName(), skills, experience, company, availability, meetingMode, helpAreas);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/request")
    public ResponseEntity<MentorshipRequestDto> requestMentorship(
            Principal principal,
            @RequestBody MentorshipRequestCreateDto createDto
    ) {
        return ResponseEntity.ok(mentorshipService.requestMentorship(principal.getName(), createDto));
    }

    @PostMapping("/requests/{id}/accept")
    public ResponseEntity<MentorshipRequestDto> acceptMentorship(Principal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(mentorshipService.acceptMentorship(principal.getName(), id));
    }

    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<MentorshipRequestDto> rejectMentorship(Principal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(mentorshipService.rejectMentorship(principal.getName(), id));
    }

    @PostMapping("/requests/{id}/schedule")
    public ResponseEntity<MentorshipRequestDto> scheduleSession(
            Principal principal,
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime sessionDate
    ) {
        return ResponseEntity.ok(mentorshipService.scheduleSession(principal.getName(), id, sessionDate));
    }

    @PostMapping("/requests/{id}/feedback")
    public ResponseEntity<MentorshipRequestDto> submitFeedback(
            Principal principal,
            @PathVariable UUID id,
            @RequestParam String feedback,
            @RequestParam Integer rating
    ) {
        return ResponseEntity.ok(mentorshipService.submitFeedback(principal.getName(), id, feedback, rating));
    }

    @GetMapping("/requests/mentor")
    public ResponseEntity<List<MentorshipRequestDto>> getRequestsAsMentor(Principal principal) {
        return ResponseEntity.ok(mentorshipService.getMentorshipRequests(principal.getName(), true));
    }

    @GetMapping("/requests/mentee")
    public ResponseEntity<List<MentorshipRequestDto>> getRequestsAsMentee(Principal principal) {
        return ResponseEntity.ok(mentorshipService.getMentorshipRequests(principal.getName(), false));
    }

    @GetMapping("/mentors")
    public ResponseEntity<List<User>> getMentors() {
        return ResponseEntity.ok(mentorshipService.getActiveMentors());
    }
}
