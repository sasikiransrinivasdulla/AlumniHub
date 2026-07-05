package com.alumnihub.service;

import com.alumnihub.dto.ReunionCollectionDto;
import com.alumnihub.dto.ReunionCommentDto;
import com.alumnihub.dto.ReunionMediaDto;
import com.alumnihub.entity.*;
import com.alumnihub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReunionService {

    private final ReunionCollectionRepository reunionCollectionRepository;
    private final ReunionMediaRepository reunionMediaRepository;
    private final ReunionCommentRepository reunionCommentRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReunionCollectionDto createReunion(String title, String description, LocalDateTime date, String location) {
        ReunionCollection reunion = ReunionCollection.builder()
                .title(title)
                .description(description)
                .date(date)
                .location(location)
                .build();

        ReunionCollection saved = reunionCollectionRepository.save(reunion);
        return convertToDto(saved, null);
    }

    public List<ReunionCollectionDto> getReunions(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        return reunionCollectionRepository.findAll().stream()
                .map(r -> convertToDto(r, user))
                .collect(Collectors.toList());
    }

    @Transactional
    public ReunionCollectionDto rsvpReunion(String userEmail, UUID reunionId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        ReunionCollection r = reunionCollectionRepository.findById(reunionId)
                .orElseThrow(() -> new IllegalArgumentException("Reunion not found: " + reunionId));

        r.getAttendees().add(user);
        return convertToDto(reunionCollectionRepository.save(r), user);
    }

    @Transactional
    public ReunionCollectionDto withdrawReunion(String userEmail, UUID reunionId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        ReunionCollection r = reunionCollectionRepository.findById(reunionId)
                .orElseThrow(() -> new IllegalArgumentException("Reunion not found: " + reunionId));

        r.getAttendees().remove(user);
        return convertToDto(reunionCollectionRepository.save(r), user);
    }

    @Transactional
    public ReunionMediaDto addMedia(String userEmail, UUID reunionId, String url, String mediaType, String caption) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        ReunionCollection r = reunionCollectionRepository.findById(reunionId)
                .orElseThrow(() -> new IllegalArgumentException("Reunion not found: " + reunionId));

        ReunionMedia media = ReunionMedia.builder()
                .reunion(r)
                .url(url)
                .mediaType(mediaType)
                .caption(caption)
                .creator(user)
                .build();

        ReunionMedia saved = reunionMediaRepository.save(media);
        return convertMediaToDto(saved);
    }

    @Transactional
    public ReunionCommentDto addComment(String userEmail, UUID reunionId, String text) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        ReunionCollection r = reunionCollectionRepository.findById(reunionId)
                .orElseThrow(() -> new IllegalArgumentException("Reunion not found: " + reunionId));

        ReunionComment comment = ReunionComment.builder()
                .reunion(r)
                .user(user)
                .text(text)
                .build();

        ReunionComment saved = reunionCommentRepository.save(comment);
        return convertCommentToDto(saved);
    }

    private ReunionCollectionDto convertToDto(ReunionCollection r, User user) {
        return ReunionCollectionDto.builder()
                .id(r.getId())
                .title(r.getTitle())
                .description(r.getDescription())
                .date(r.getDate())
                .location(r.getLocation())
                .photos(r.getPhotos().stream().map(this::convertMediaToDto).collect(Collectors.toList()))
                .comments(r.getComments().stream().map(this::convertCommentToDto).collect(Collectors.toList()))
                .attendeesCount(r.getAttendees().size())
                .attending(user != null && r.getAttendees().contains(user))
                .build();
    }

    private ReunionMediaDto convertMediaToDto(ReunionMedia rm) {
        return ReunionMediaDto.builder()
                .id(rm.getId())
                .url(rm.getUrl())
                .mediaType(rm.getMediaType())
                .caption(rm.getCaption())
                .creatorId(rm.getCreator().getId())
                .creatorName(rm.getCreator().getFullName())
                .build();
    }

    private ReunionCommentDto convertCommentToDto(ReunionComment rc) {
        return ReunionCommentDto.builder()
                .id(rc.getId())
                .userId(rc.getUser().getId())
                .userFullName(rc.getUser().getFullName())
                .userProfilePicture(rc.getUser().getProfilePictureUrl())
                .text(rc.getText())
                .createdAt(rc.getCreatedAt())
                .build();
    }
}
