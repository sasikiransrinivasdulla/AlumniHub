package com.alumnihub.service;

import com.alumnihub.dto.TimelineEntryDto;
import com.alumnihub.entity.TimelineEntry;
import com.alumnihub.entity.User;
import com.alumnihub.repository.TimelineEntryRepository;
import com.alumnihub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimelineService {

    private final TimelineEntryRepository timelineEntryRepository;
    private final UserRepository userRepository;

    public List<TimelineEntryDto> getTimelineForUser(UUID userId) {
        List<TimelineEntry> entries = timelineEntryRepository.findAllByUserIdOrderByYearAsc(userId);
        return entries.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public TimelineEntryDto addTimelineEntry(String email, TimelineEntryDto dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        TimelineEntry entry = TimelineEntry.builder()
                .user(user)
                .year(dto.getYear())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .build();

        TimelineEntry saved = timelineEntryRepository.save(entry);
        return convertToDto(saved);
    }

    @Transactional
    public void deleteTimelineEntry(String email, UUID entryId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        TimelineEntry entry = timelineEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Timeline entry not found: " + entryId));

        if (!entry.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not own this timeline entry.");
        }

        timelineEntryRepository.delete(entry);
    }

    private TimelineEntryDto convertToDto(TimelineEntry entry) {
        return TimelineEntryDto.builder()
                .id(entry.getId())
                .userId(entry.getUser().getId())
                .year(entry.getYear())
                .title(entry.getTitle())
                .description(entry.getDescription())
                .build();
    }
}
