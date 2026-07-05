package com.alumnihub.controller;

import com.alumnihub.dto.UserDto;
import com.alumnihub.entity.InTouchConnection;
import com.alumnihub.entity.User;
import com.alumnihub.repository.InTouchConnectionRepository;
import com.alumnihub.repository.UserRepository;
import com.alumnihub.service.AlumniService;
import com.alumnihub.service.InTouchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/in-touch")
@RequiredArgsConstructor
public class InTouchController {

    private final InTouchService inTouchService;
    private final AlumniService alumniService;
    private final InTouchConnectionRepository inTouchConnectionRepository;
    private final UserRepository userRepository;

    @PostMapping("/request/{targetUserId}")
    public ResponseEntity<Void> sendRequest(Principal principal, @PathVariable UUID targetUserId) {
        inTouchService.sendRequest(principal.getName(), targetUserId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/cancel/{targetUserId}")
    public ResponseEntity<Void> cancelRequest(Principal principal, @PathVariable UUID targetUserId) {
        inTouchService.cancelRequest(principal.getName(), targetUserId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/accept/{senderUserId}")
    public ResponseEntity<Void> acceptRequest(Principal principal, @PathVariable UUID senderUserId) {
        inTouchService.acceptRequest(principal.getName(), senderUserId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reject/{senderUserId}")
    public ResponseEntity<Void> rejectRequest(Principal principal, @PathVariable UUID senderUserId) {
        inTouchService.rejectRequest(principal.getName(), senderUserId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/remove/{targetUserId}")
    public ResponseEntity<Void> removeConnection(Principal principal, @PathVariable UUID targetUserId) {
        inTouchService.removeConnection(principal.getName(), targetUserId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/requests/received")
    public ResponseEntity<List<UserDto>> getReceivedRequests(Principal principal) {
        User requester = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<InTouchConnection> connections = inTouchConnectionRepository.findPendingRequestsReceived(requester.getId());
        
        List<UserDto> dtos = connections.stream()
                .map(c -> alumniService.convertToDtoWithContext(requester, c.getUser()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/requests/sent")
    public ResponseEntity<List<UserDto>> getSentRequests(Principal principal) {
        User requester = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<InTouchConnection> connections = inTouchConnectionRepository.findPendingRequestsSent(requester.getId());
        
        List<UserDto> dtos = connections.stream()
                .map(c -> alumniService.convertToDtoWithContext(requester, c.getTargetUser()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/connections")
    public ResponseEntity<List<UserDto>> getConnections(Principal principal) {
        User requester = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<InTouchConnection> connections = inTouchConnectionRepository.findAllAcceptedConnectionsForUser(requester.getId());
        
        List<UserDto> dtos = connections.stream()
                .map(c -> {
                    User other = c.getUser().getId().equals(requester.getId()) ? c.getTargetUser() : c.getUser();
                    return alumniService.convertToDtoWithContext(requester, other);
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
