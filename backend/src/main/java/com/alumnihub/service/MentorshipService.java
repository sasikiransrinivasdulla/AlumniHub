package com.alumnihub.service;

import com.alumnihub.dto.MentorshipRequestCreateDto;
import com.alumnihub.dto.MentorshipRequestDto;
import com.alumnihub.dto.UserDto;
import com.alumnihub.entity.MentorshipRequest;
import com.alumnihub.entity.User;
import com.alumnihub.repository.MentorshipRequestRepository;
import com.alumnihub.repository.UserRepository;
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
public class MentorshipService {

    private final MentorshipRequestRepository mentorshipRequestRepository;
    private final UserRepository userRepository;

    @Transactional
    public void registerAsMentor(String userEmail, String skills, String experience, String company, String availability, String meetingMode, String helpAreas) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        user.setMentorSkills(skills);
        user.setMentorExperience(experience);
        user.setMentorCompany(company);
        user.setMentorAvailability(availability);
        user.setMentorMeetingMode(meetingMode);
        user.setMentorHelpAreas(helpAreas);

        // Add Mentor badge if not already present
        String currentBadges = user.getBadges();
        if (currentBadges == null || currentBadges.trim().isEmpty()) {
            user.setBadges("Mentor");
        } else if (!currentBadges.contains("Mentor")) {
            user.setBadges(currentBadges + ",Mentor");
        }

        userRepository.save(user);
    }

    @Transactional
    public MentorshipRequestDto requestMentorship(String menteeEmail, MentorshipRequestCreateDto createDto) {
        User mentee = userRepository.findByEmail(menteeEmail)
                .orElseThrow(() -> new IllegalArgumentException("Mentee not found: " + menteeEmail));

        User mentor = userRepository.findById(createDto.getMentorId())
                .orElseThrow(() -> new IllegalArgumentException("Mentor not found: " + createDto.getMentorId()));

        MentorshipRequest request = MentorshipRequest.builder()
                .mentee(mentee)
                .mentor(mentor)
                .message(createDto.getMessage())
                .sessionDate(createDto.getSessionDate())
                .status("PENDING")
                .build();

        MentorshipRequest saved = mentorshipRequestRepository.save(request);
        return convertToDto(saved);
    }

    @Transactional
    public MentorshipRequestDto acceptMentorship(String mentorEmail, UUID requestId) {
        MentorshipRequest request = mentorshipRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!request.getMentor().getEmail().equalsIgnoreCase(mentorEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to accept this request.");
        }

        request.setStatus("ACCEPTED");
        return convertToDto(mentorshipRequestRepository.save(request));
    }

    @Transactional
    public MentorshipRequestDto rejectMentorship(String mentorEmail, UUID requestId) {
        MentorshipRequest request = mentorshipRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!request.getMentor().getEmail().equalsIgnoreCase(mentorEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to reject this request.");
        }

        request.setStatus("REJECTED");
        return convertToDto(mentorshipRequestRepository.save(request));
    }

    @Transactional
    public MentorshipRequestDto scheduleSession(String userEmail, UUID requestId, LocalDateTime sessionDate) {
        MentorshipRequest request = mentorshipRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!request.getMentor().getEmail().equalsIgnoreCase(userEmail) && !request.getMentee().getEmail().equalsIgnoreCase(userEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized.");
        }

        request.setSessionDate(sessionDate);
        return convertToDto(mentorshipRequestRepository.save(request));
    }

    @Transactional
    public MentorshipRequestDto submitFeedback(String menteeEmail, UUID requestId, String feedback, Integer rating) {
        MentorshipRequest request = mentorshipRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!request.getMentee().getEmail().equalsIgnoreCase(menteeEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to submit feedback.");
        }

        request.setFeedback(feedback);
        request.setRating(rating);
        return convertToDto(mentorshipRequestRepository.save(request));
    }

    public List<MentorshipRequestDto> getMentorshipRequests(String userEmail, boolean asMentor) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        List<MentorshipRequest> requests = asMentor
                ? mentorshipRequestRepository.findAllByMentor(user)
                : mentorshipRequestRepository.findAllByMentee(user);

        return requests.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public List<User> getActiveMentors() {
        return userRepository.findAll().stream()
                .filter(u -> u.getBadges() != null && u.getBadges().contains("Mentor"))
                .collect(Collectors.toList());
    }

    private MentorshipRequestDto convertToDto(MentorshipRequest r) {
        return MentorshipRequestDto.builder()
                .id(r.getId())
                .mentorId(r.getMentor().getId())
                .mentorName(r.getMentor().getFullName())
                .mentorProfilePicture(r.getMentor().getProfilePictureUrl())
                .menteeId(r.getMentee().getId())
                .menteeName(r.getMentee().getFullName())
                .menteeProfilePicture(r.getMentee().getProfilePictureUrl())
                .status(r.getStatus())
                .message(r.getMessage())
                .sessionDate(r.getSessionDate())
                .feedback(r.getFeedback())
                .rating(r.getRating())
                .build();
    }
}
