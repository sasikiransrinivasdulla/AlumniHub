package com.alumnihub.service;

import com.alumnihub.entity.InTouchConnection;
import com.alumnihub.entity.NotificationType;
import com.alumnihub.entity.User;
import com.alumnihub.repository.InTouchConnectionRepository;
import com.alumnihub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class InTouchService {

    private final InTouchConnectionRepository inTouchConnectionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public void sendRequest(String senderEmail, UUID targetUserId) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + senderEmail));
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found: " + targetUserId));

        if (sender.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot connect with yourself.");
        }

        Optional<InTouchConnection> existing = inTouchConnectionRepository.findConnectionBetween(sender.getId(), targetUserId);
        if (existing.isPresent()) {
            InTouchConnection conn = existing.get();
            if ("ACCEPTED".equals(conn.getStatus())) {
                throw new IllegalStateException("Already in touch with this user.");
            } else if ("PENDING".equals(conn.getStatus())) {
                throw new IllegalStateException("Request is already pending.");
            } else {
                conn.setStatus("PENDING");
                conn.setUser(sender);
                conn.setTargetUser(target);
                inTouchConnectionRepository.save(conn);
            }
        } else {
            InTouchConnection conn = InTouchConnection.builder()
                    .user(sender)
                    .targetUser(target)
                    .status("PENDING")
                    .build();
            inTouchConnectionRepository.save(conn);
        }

        notificationService.createNotification(
                target,
                sender,
                NotificationType.IN_TOUCH_REQUEST,
                sender.getId(),
                sender.getFullName() + " has sent you an In-Touch connection request."
        );
    }

    public void cancelRequest(String senderEmail, UUID targetUserId) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + senderEmail));

        InTouchConnection conn = inTouchConnectionRepository.findConnectionBetween(sender.getId(), targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("No relationship exists."));

        if (!"PENDING".equals(conn.getStatus())) {
            throw new IllegalStateException("Connection request is not pending.");
        }
        if (!conn.getUser().getId().equals(sender.getId())) {
            throw new IllegalStateException("You are not the sender of this request.");
        }

        inTouchConnectionRepository.delete(conn);
    }

    public void acceptRequest(String receiverEmail, UUID senderUserId) {
        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + receiverEmail));

        InTouchConnection conn = inTouchConnectionRepository.findConnectionBetween(receiver.getId(), senderUserId)
                .orElseThrow(() -> new IllegalArgumentException("No relationship exists."));

        if (!"PENDING".equals(conn.getStatus())) {
            throw new IllegalStateException("Connection request is not pending.");
        }
        if (!conn.getTargetUser().getId().equals(receiver.getId())) {
            throw new IllegalStateException("You are not the target of this request.");
        }

        conn.setStatus("ACCEPTED");
        conn.setConnectedAt(LocalDateTime.now());
        inTouchConnectionRepository.save(conn);

        notificationService.createNotification(
                conn.getUser(),
                receiver,
                NotificationType.IN_TOUCH_ACCEPT,
                receiver.getId(),
                receiver.getFullName() + " has accepted your In-Touch connection request."
        );
    }

    public void rejectRequest(String receiverEmail, UUID senderUserId) {
        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + receiverEmail));

        InTouchConnection conn = inTouchConnectionRepository.findConnectionBetween(receiver.getId(), senderUserId)
                .orElseThrow(() -> new IllegalArgumentException("No relationship exists."));

        if (!"PENDING".equals(conn.getStatus())) {
            throw new IllegalStateException("Connection request is not pending.");
        }
        if (!conn.getTargetUser().getId().equals(receiver.getId())) {
            throw new IllegalStateException("You are not the target of this request.");
        }

        conn.setStatus("REJECTED");
        inTouchConnectionRepository.save(conn);

        notificationService.createNotification(
                conn.getUser(),
                receiver,
                NotificationType.IN_TOUCH_REJECT,
                receiver.getId(),
                receiver.getFullName() + " declined your In-Touch connection request."
        );
    }

    public void removeConnection(String userEmail, UUID targetUserId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        InTouchConnection conn = inTouchConnectionRepository.findConnectionBetween(user.getId(), targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("No relationship exists."));

        if (!"ACCEPTED".equals(conn.getStatus())) {
            throw new IllegalStateException("You are not in touch with this user.");
        }

        inTouchConnectionRepository.delete(conn);
    }
}
