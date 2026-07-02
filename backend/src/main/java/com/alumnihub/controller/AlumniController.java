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
    public ResponseEntity<List<UserDto>> searchDirectory(Principal principal, @RequestParam("q") String query) {
        List<UserDto> matchedAlumni = alumniService.searchVisibleAlumni(principal.getName(), query);
        return ResponseEntity.ok(matchedAlumni);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getAlumniDetails(Principal principal, @PathVariable UUID id) {
        UserDto alumniDetails = alumniService.getAlumniDetailsById(principal.getName(), id);
        return ResponseEntity.ok(alumniDetails);
    }
}
