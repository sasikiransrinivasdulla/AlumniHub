package com.alumnihub.controller;

import com.alumnihub.dto.UserDto;
import com.alumnihub.entity.ContactRequest;
import com.alumnihub.entity.User;
import com.alumnihub.repository.ContactRequestRepository;
import com.alumnihub.repository.UserRepository;
import com.alumnihub.service.AlumniService;
import com.alumnihub.service.ContactRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contact-requests")
@RequiredArgsConstructor
public class ContactRequestController {

    private final ContactRequestService contactRequestService;
    private final AlumniService alumniService;
    private final ContactRequestRepository contactRequestRepository;
    private final UserRepository userRepository;

    @PostMapping("/request/{ownerUserId}")
    public ResponseEntity<Void> requestContact(Principal principal, @PathVariable UUID ownerUserId) {
        contactRequestService.requestContactDetails(principal.getName(), ownerUserId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/accept/{requesterUserId}")
    public ResponseEntity<Void> acceptRequest(Principal principal, @PathVariable UUID requesterUserId) {
        contactRequestService.acceptContactRequest(principal.getName(), requesterUserId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reject/{requesterUserId}")
    public ResponseEntity<Void> rejectRequest(Principal principal, @PathVariable UUID requesterUserId) {
        contactRequestService.rejectContactRequest(principal.getName(), requesterUserId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/pending")
    public ResponseEntity<List<UserDto>> getPendingRequests(Principal principal) {
        User owner = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<ContactRequest> requests = contactRequestRepository.findPendingRequestsReceived(owner.getId());
        
        List<UserDto> dtos = requests.stream()
                .map(r -> alumniService.convertToDtoWithContext(owner, r.getRequester()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
