package com.alumnihub.service;

import com.alumnihub.dto.JobOpeningCreateDto;
import com.alumnihub.dto.JobOpeningDto;
import com.alumnihub.entity.JobOpening;
import com.alumnihub.entity.User;
import com.alumnihub.repository.JobOpeningRepository;
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
public class JobService {

    private final JobOpeningRepository jobOpeningRepository;
    private final UserRepository userRepository;

    @Transactional
    public JobOpeningDto createJob(String userEmail, JobOpeningCreateDto createDto) {
        User creator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        JobOpening job = JobOpening.builder()
                .company(createDto.getCompany())
                .role(createDto.getRole())
                .location(createDto.getLocation())
                .category(createDto.getCategory())
                .description(createDto.getDescription())
                .requirements(createDto.getRequirements())
                .externalLink(createDto.getExternalLink())
                .creator(creator)
                .build();

        JobOpening saved = jobOpeningRepository.save(job);
        return convertToDto(saved, creator);
    }

    public List<JobOpeningDto> getJobs(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        return jobOpeningRepository.findAll().stream()
                .map(j -> convertToDto(j, user))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteJob(String userEmail, UUID jobId) {
        JobOpening job = jobOpeningRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        if (!job.getCreator().getEmail().equalsIgnoreCase(userEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to delete this job.");
        }

        jobOpeningRepository.delete(job);
    }

    @Transactional
    public JobOpeningDto saveJob(String userEmail, UUID jobId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        JobOpening job = jobOpeningRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        job.getSavedBy().add(user);
        JobOpening saved = jobOpeningRepository.save(job);
        return convertToDto(saved, user);
    }

    @Transactional
    public JobOpeningDto unsaveJob(String userEmail, UUID jobId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        JobOpening job = jobOpeningRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        job.getSavedBy().remove(user);
        JobOpening saved = jobOpeningRepository.save(job);
        return convertToDto(saved, user);
    }

    public List<JobOpeningDto> getSavedJobs(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        return jobOpeningRepository.findAll().stream()
                .filter(j -> j.getSavedBy().contains(user))
                .map(j -> convertToDto(j, user))
                .collect(Collectors.toList());
    }

    private JobOpeningDto convertToDto(JobOpening j, User user) {
        return JobOpeningDto.builder()
                .id(j.getId())
                .company(j.getCompany())
                .role(j.getRole())
                .location(j.getLocation())
                .category(j.getCategory())
                .description(j.getDescription())
                .requirements(j.getRequirements())
                .externalLink(j.getExternalLink())
                .creatorId(j.getCreator().getId())
                .creatorName(j.getCreator().getFullName())
                .saved(j.getSavedBy().contains(user))
                .build();
    }
}
