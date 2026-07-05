package com.alumnihub.service;

import com.alumnihub.dto.EventCreateDto;
import com.alumnihub.dto.EventDto;
import com.alumnihub.entity.Event;
import com.alumnihub.entity.User;
import com.alumnihub.repository.EventRepository;
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
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    @Transactional
    public EventDto createEvent(String organizerEmail, EventCreateDto createDto) {
        User organizer = userRepository.findByEmail(organizerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + organizerEmail));

        Event event = Event.builder()
                .title(createDto.getTitle())
                .description(createDto.getDescription())
                .bannerUrl(createDto.getBannerUrl())
                .location(createDto.getLocation())
                .online(createDto.getOnline() != null ? createDto.getOnline() : false)
                .meetingLink(createDto.getMeetingLink())
                .startDate(createDto.getStartDate())
                .endDate(createDto.getEndDate())
                .capacity(createDto.getCapacity())
                .organizer(organizer)
                .build();

        Event saved = eventRepository.save(event);
        return convertToDto(saved, organizer);
    }

    @Transactional
    public EventDto updateEvent(String organizerEmail, UUID eventId, EventCreateDto createDto) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found with ID: " + eventId));

        if (!event.getOrganizer().getEmail().equalsIgnoreCase(organizerEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to update this event.");
        }

        event.setTitle(createDto.getTitle());
        event.setDescription(createDto.getDescription());
        event.setBannerUrl(createDto.getBannerUrl());
        event.setLocation(createDto.getLocation());
        event.setOnline(createDto.getOnline() != null ? createDto.getOnline() : false);
        event.setMeetingLink(createDto.getMeetingLink());
        event.setStartDate(createDto.getStartDate());
        event.setEndDate(createDto.getEndDate());
        event.setCapacity(createDto.getCapacity());

        Event saved = eventRepository.save(event);
        User organizer = event.getOrganizer();
        return convertToDto(saved, organizer);
    }

    @Transactional
    public void deleteEvent(String organizerEmail, UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found with ID: " + eventId));

        if (!event.getOrganizer().getEmail().equalsIgnoreCase(organizerEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to delete this event.");
        }

        eventRepository.delete(event);
    }

    @Transactional
    public EventDto rsvpEvent(String userEmail, UUID eventId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found with ID: " + eventId));

        if (event.getCapacity() != null && event.getParticipants().size() >= event.getCapacity()) {
            throw new IllegalStateException("Event capacity reached.");
        }

        event.getParticipants().add(user);
        Event saved = eventRepository.save(event);
        return convertToDto(saved, user);
    }

    @Transactional
    public EventDto withdrawRsvp(String userEmail, UUID eventId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found with ID: " + eventId));

        event.getParticipants().remove(user);
        Event saved = eventRepository.save(event);
        return convertToDto(saved, user);
    }

    public List<EventDto> getUpcomingEvents(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        return eventRepository.findAll().stream()
                .filter(e -> e.getStartDate().isAfter(LocalDateTime.now()))
                .map(e -> convertToDto(e, user))
                .collect(Collectors.toList());
    }

    public List<EventDto> getPastEvents(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        return eventRepository.findAll().stream()
                .filter(e -> e.getStartDate().isBefore(LocalDateTime.now()))
                .map(e -> convertToDto(e, user))
                .collect(Collectors.toList());
    }

    public List<EventDto> getPopularEvents(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        return eventRepository.findAll().stream()
                .sorted((a, b) -> Integer.compare(b.getParticipants().size(), a.getParticipants().size()))
                .map(e -> convertToDto(e, user))
                .collect(Collectors.toList());
    }

    public List<EventDto> getMyEvents(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        return eventRepository.findAll().stream()
                .filter(e -> e.getOrganizer().getId().equals(user.getId()) || e.getParticipants().contains(user))
                .map(e -> convertToDto(e, user))
                .collect(Collectors.toList());
    }

    private EventDto convertToDto(Event event, User user) {
        return EventDto.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .bannerUrl(event.getBannerUrl())
                .location(event.getLocation())
                .online(event.getOnline())
                .meetingLink(event.getMeetingLink())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .capacity(event.getCapacity())
                .organizerId(event.getOrganizer().getId())
                .organizerName(event.getOrganizer().getFullName())
                .participantsCount(event.getParticipants().size())
                .participating(event.getParticipants().contains(user))
                .build();
    }
}
