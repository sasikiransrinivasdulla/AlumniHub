package com.alumnihub.service;

import com.alumnihub.dto.ReferralCreateDto;
import com.alumnihub.dto.ReferralDto;
import com.alumnihub.dto.ReferralRequestDto;
import com.alumnihub.entity.Referral;
import com.alumnihub.entity.ReferralRequest;
import com.alumnihub.entity.User;
import com.alumnihub.repository.ReferralRepository;
import com.alumnihub.repository.ReferralRequestRepository;
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
public class ReferralService {

    private final ReferralRepository referralRepository;
    private final ReferralRequestRepository referralRequestRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReferralDto createReferral(String userEmail, ReferralCreateDto createDto) {
        User creator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        Referral referral = Referral.builder()
                .company(createDto.getCompany())
                .role(createDto.getRole())
                .location(createDto.getLocation())
                .experienceRequired(createDto.getExperienceRequired())
                .salaryRange(createDto.getSalaryRange())
                .deadline(createDto.getDeadline())
                .requirements(createDto.getRequirements())
                .creator(creator)
                .build();

        Referral saved = referralRepository.save(referral);
        return convertToDto(saved);
    }

    public List<ReferralDto> getReferrals() {
        return referralRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteReferral(String userEmail, UUID referralId) {
        Referral referral = referralRepository.findById(referralId)
                .orElseThrow(() -> new IllegalArgumentException("Referral not found: " + referralId));

        if (!referral.getCreator().getEmail().equalsIgnoreCase(userEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized to delete this referral.");
        }

        referralRepository.delete(referral);
    }

    @Transactional
    public ReferralRequestDto requestReferral(String requesterEmail, UUID referralId, String resumeUrl) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + requesterEmail));

        Referral referral = referralRepository.findById(referralId)
                .orElseThrow(() -> new IllegalArgumentException("Referral not found: " + referralId));

        ReferralRequest request = ReferralRequest.builder()
                .referral(referral)
                .requester(requester)
                .resumeUrl(resumeUrl)
                .status("PENDING")
                .build();

        ReferralRequest saved = referralRequestRepository.save(request);
        return convertRequestToDto(saved);
    }

    public List<ReferralRequestDto> getReferralRequests(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        return referralRequestRepository.findAllByRequester(user).stream()
                .map(this::convertRequestToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReferralRequestDto fulfillReferralRequest(String creatorEmail, UUID requestId) {
        ReferralRequest request = referralRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!request.getReferral().getCreator().getEmail().equalsIgnoreCase(creatorEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized.");
        }

        request.setStatus("FULFILLED");
        return convertRequestToDto(referralRequestRepository.save(request));
    }

    @Transactional
    public ReferralRequestDto rejectReferralRequest(String creatorEmail, UUID requestId) {
        ReferralRequest request = referralRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!request.getReferral().getCreator().getEmail().equalsIgnoreCase(creatorEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized.");
        }

        request.setStatus("REJECTED");
        return convertRequestToDto(referralRequestRepository.save(request));
    }

    private ReferralDto convertToDto(Referral r) {
        return ReferralDto.builder()
                .id(r.getId())
                .company(r.getCompany())
                .role(r.getRole())
                .location(r.getLocation())
                .experienceRequired(r.getExperienceRequired())
                .salaryRange(r.getSalaryRange())
                .deadline(r.getDeadline())
                .requirements(r.getRequirements())
                .creatorId(r.getCreator().getId())
                .creatorName(r.getCreator().getFullName())
                .build();
    }

    private ReferralRequestDto convertRequestToDto(ReferralRequest rr) {
        return ReferralRequestDto.builder()
                .id(rr.getId())
                .referralId(rr.getReferral().getId())
                .referralCompany(rr.getReferral().getCompany())
                .referralRole(rr.getReferral().getRole())
                .requesterId(rr.getRequester().getId())
                .requesterName(rr.getRequester().getFullName())
                .resumeUrl(rr.getResumeUrl())
                .status(rr.getStatus())
                .build();
    }
}
