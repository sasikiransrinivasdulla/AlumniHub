package com.alumnihub.service;

import com.alumnihub.entity.ContactRequest;
import com.alumnihub.entity.NotificationType;
import com.alumnihub.entity.User;
import com.alumnihub.repository.ContactRequestRepository;
import com.alumnihub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ContactRequestService {

    private final ContactRequestRepository contactRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public void requestContactDetails(String requesterEmail, UUID ownerUserId) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + requesterEmail));
        User owner = userRepository.findById(ownerUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found: " + ownerUserId));

        if (requester.getId().equals(ownerUserId)) {
            throw new IllegalArgumentException("You cannot request your own contact details.");
        }

        Optional<ContactRequest> existing = contactRequestRepository.findRequest(requester.getId(), ownerUserId);
        if (existing.isPresent()) {
            ContactRequest req = existing.get();
            if ("ACCEPTED".equals(req.getStatus())) {
                throw new IllegalStateException("Contact details already shared.");
            } else if ("PENDING".equals(req.getStatus())) {
                throw new IllegalStateException("Request is already pending.");
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
    }

    public void acceptContactRequest(String ownerEmail, UUID requesterUserId) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + ownerEmail));

        ContactRequest req = contactRequestRepository.findRequest(requesterUserId, owner.getId())
                .orElseThrow(() -> new IllegalArgumentException("No contact request exists."));

        if (!"PENDING".equals(req.getStatus())) {
            throw new IllegalStateException("Request is not pending.");
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
    }

    public void rejectContactRequest(String ownerEmail, UUID requesterUserId) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + ownerEmail));

        ContactRequest req = contactRequestRepository.findRequest(requesterUserId, owner.getId())
                .orElseThrow(() -> new IllegalArgumentException("No contact request exists."));

        if (!"PENDING".equals(req.getStatus())) {
            throw new IllegalStateException("Request is not pending.");
        }

        req.setStatus("REJECTED");
        contactRequestRepository.save(req);
    }
}
