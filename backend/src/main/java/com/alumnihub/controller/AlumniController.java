package com.alumnihub.controller;

import com.alumnihub.dto.UserDto;
import com.alumnihub.service.AlumniService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/alumni")
@RequiredArgsConstructor
public class AlumniController {

    private final AlumniService alumniService;

    @GetMapping
    public ResponseEntity<List<UserDto>> getDirectory(Principal principal) {
        List<UserDto> visibleAlumni = alumniService.getVisibleAlumni(principal.getName());
        return ResponseEntity.ok(visibleAlumni);
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchDirectory(
            Principal principal,
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "company", required = false) String company,
            @RequestParam(value = "position", required = false) String position,
            @RequestParam(value = "batch", required = false) String batch,
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "section", required = false) String section,
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "skills", required = false) String skills,
            @RequestParam(value = "openTo", required = false) String openTo,
            @RequestParam(value = "badge", required = false) String badge
    ) {
        List<UserDto> matchedAlumni = alumniService.searchVisibleAlumniWithFilters(
                principal.getName(), query, company, position, batch, department, section, city, skills, openTo, badge
        );
        return ResponseEntity.ok(matchedAlumni);
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<UserDto>> getRecommendations(Principal principal) {
        List<UserDto> recommended = alumniService.getPeopleYouMayKnow(principal.getName());
        return ResponseEntity.ok(recommended);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getAlumniDetails(Principal principal, @PathVariable UUID id) {
        UserDto alumniDetails = alumniService.getAlumniDetailsById(principal.getName(), id);
        return ResponseEntity.ok(alumniDetails);
    }
}
