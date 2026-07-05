package com.alumnihub.controller;

import com.alumnihub.dto.JobOpeningCreateDto;
import com.alumnihub.dto.JobOpeningDto;
import com.alumnihub.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @PostMapping
    public ResponseEntity<JobOpeningDto> createJob(Principal principal, @RequestBody JobOpeningCreateDto createDto) {
        return ResponseEntity.ok(jobService.createJob(principal.getName(), createDto));
    }

    @GetMapping
    public ResponseEntity<List<JobOpeningDto>> getJobs(Principal principal) {
        return ResponseEntity.ok(jobService.getJobs(principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(Principal principal, @PathVariable UUID id) {
        jobService.deleteJob(principal.getName(), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<JobOpeningDto> saveJob(Principal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(jobService.saveJob(principal.getName(), id));
    }

    @PostMapping("/{id}/unsave")
    public ResponseEntity<JobOpeningDto> unsaveJob(Principal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(jobService.unsaveJob(principal.getName(), id));
    }

    @GetMapping("/saved")
    public ResponseEntity<List<JobOpeningDto>> getSavedJobs(Principal principal) {
        return ResponseEntity.ok(jobService.getSavedJobs(principal.getName()));
    }
}
