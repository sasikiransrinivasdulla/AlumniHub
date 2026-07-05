package com.alumnihub.service;

import com.alumnihub.dto.AchievementCreateDto;
import com.alumnihub.dto.AchievementDto;
import com.alumnihub.entity.Achievement;
import com.alumnihub.entity.User;
import com.alumnihub.repository.AchievementRepository;
import com.alumnihub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserRepository userRepository;

    @Transactional
    public AchievementDto createAchievement(String userEmail, AchievementCreateDto createDto) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        Achievement ach = Achievement.builder()
                .user(user)
                .type(createDto.getType())
                .title(createDto.getTitle())
                .description(createDto.getDescription())
                .companyOrInstitution(createDto.getCompanyOrInstitution())
                .date(createDto.getDate())
                .link(createDto.getLink())
                .build();

        Achievement saved = achievementRepository.save(ach);
        return convertToDto(saved);
    }

    public List<AchievementDto> getAchievements() {
        return achievementRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteAchievement(String userEmail, UUID achievementId) {
        Achievement ach = achievementRepository.findById(achievementId)
                .orElseThrow(() -> new IllegalArgumentException("Achievement not found: " + achievementId));

        if (!ach.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to delete this achievement.");
        }

        achievementRepository.delete(ach);
    }

    private AchievementDto convertToDto(Achievement a) {
        return AchievementDto.builder()
                .id(a.getId())
                .userId(a.getUser().getId())
                .userFullName(a.getUser().getFullName())
                .userProfilePicture(a.getUser().getProfilePictureUrl())
                .type(a.getType())
                .title(a.getTitle())
                .description(a.getDescription())
                .companyOrInstitution(a.getCompanyOrInstitution())
                .date(a.getDate())
                .link(a.getLink())
                .build();
    }
}
