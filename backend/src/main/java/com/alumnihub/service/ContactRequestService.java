package com.alumnihub.service;

import com.alumnihub.entity.ContactRequest;
import com.alumnihub.entity.NotificationType;
import com.alumnihub.entity.User;
import com.alumnihub.exception.InTouchException;
import com.alumnihub.repository.ContactRequestRepository;
import com.alumnihub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ContactRequestService {

    private final ContactRequestRepository contactRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public void requestContactDetails(String requesterEmail, UUID ownerUserId) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> {
                    log.warn("Contact request failed: Requester not found with email {}", requesterEmail);
                    return new InTouchException("User not found.", "USER_NOT_FOUND");
                });
        User owner = userRepository.findById(ownerUserId)
                .orElseThrow(() -> {
                    log.warn("Contact request failed: Target user not found with ID {}", ownerUserId);
                    return new InTouchException("User not found.", "USER_NOT_FOUND");
                });

        if (requester.getId().equals(ownerUserId)) {
            log.warn("Contact request failed: User {} tried to request their own contact details.", requester.getId());
            throw new InTouchException("You cannot request your own contact details.", "SELF_REQUEST");
        }

        Optional<ContactRequest> existing = contactRequestRepository.findRequest(requester.getId(), ownerUserId);
        if (existing.isPresent()) {
            ContactRequest req = existing.get();
            if ("ACCEPTED".equals(req.getStatus())) {
                log.warn("Contact request failed: Contact details already shared between {} and {}", requester.getId(), ownerUserId);
                throw new InTouchException("Contact details already shared.", "ALREADY_CONNECTED");
            } else if ("PENDING".equals(req.getStatus())) {
                log.warn("Contact request failed: Request already pending between {} and {}", requester.getId(), ownerUserId);
                throw new InTouchException("Request is already pending.", "REQUEST_PENDING");
            } else {
                req.setStatus("PENDING");
                contactRequestRepository.save(req);
            }
        } else {
            ContactRequest req = ContactRequest.builder()
                    .requester(requester)
                    .owner(owner)
                    .status("PENDING")
                    .build();
            contactRequestRepository.save(req);
        }

        notificationService.createNotification(
                owner,
                requester,
                NotificationType.CONTACT_REQUEST,
                requester.getId(),
                requester.getFullName() + " has requested to view your phone number."
        );
        log.info("Contact request sent from {} to {}", requester.getId(), ownerUserId);
    }

    public void acceptContactRequest(String ownerEmail, UUID requesterUserId) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> {
                    log.warn("Contact accept failed: Owner not found with email {}", ownerEmail);
                    return new InTouchException("User not found.", "USER_NOT_FOUND");
                });

        ContactRequest req = contactRequestRepository.findRequest(requesterUserId, owner.getId())
                .orElseThrow(() -> {
                    log.warn("Contact accept failed: No request between {} and {}", requesterUserId, owner.getId());
                    return new InTouchException("No contact request exists.", "INVALID_REQUEST");
                });

        if (!"PENDING".equals(req.getStatus())) {
            log.warn("Contact accept failed: Request status is {} (not pending) for {} → {}", req.getStatus(), requesterUserId, owner.getId());
            throw new InTouchException("Request is not pending.", "INVALID_REQUEST");
        }

        req.setStatus("ACCEPTED");
        contactRequestRepository.save(req);

        notificationService.createNotification(
                req.getRequester(),
                owner,
                NotificationType.CONTACT_ACCEPT,
                owner.getId(),
                owner.getFullName() + " has approved your request to view their phone number."
        );
        log.info("Contact request from {} accepted by {}", requesterUserId, owner.getId());
    }

    public void rejectContactRequest(String ownerEmail, UUID requesterUserId) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> {
                    log.warn("Contact reject failed: Owner not found with email {}", ownerEmail);
                    return new InTouchException("User not found.", "USER_NOT_FOUND");
                });

        ContactRequest req = contactRequestRepository.findRequest(requesterUserId, owner.getId())
                .orElseThrow(() -> {
                    log.warn("Contact reject failed: No request between {} and {}", requesterUserId, owner.getId());
                    return new InTouchException("No contact request exists.", "INVALID_REQUEST");
                });

        if (!"PENDING".equals(req.getStatus())) {
            log.warn("Contact reject failed: Request status is {} (not pending) for {} → {}", req.getStatus(), requesterUserId, owner.getId());
            throw new InTouchException("Request is not pending.", "INVALID_REQUEST");
        }

        req.setStatus("REJECTED");
        contactRequestRepository.save(req);
        log.info("Contact request from {} rejected by {}", requesterUserId, owner.getId());
    }
}
