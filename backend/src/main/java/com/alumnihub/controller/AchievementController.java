package com.alumnihub.controller;

import com.alumnihub.dto.AchievementCreateDto;
import com.alumnihub.dto.AchievementDto;
import com.alumnihub.service.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    @PostMapping
    public ResponseEntity<AchievementDto> createAchievement(Principal principal, @RequestBody AchievementCreateDto createDto) {
        return ResponseEntity.ok(achievementService.createAchievement(principal.getName(), createDto));
    }

    @GetMapping
    public ResponseEntity<List<AchievementDto>> getAchievements() {
        return ResponseEntity.ok(achievementService.getAchievements());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAchievement(Principal principal, @PathVariable UUID id) {
        achievementService.deleteAchievement(principal.getName(), id);
        return ResponseEntity.ok().build();
    }
}
