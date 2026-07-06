package com.alumnihub.service;

import com.alumnihub.entity.InTouchConnection;
import com.alumnihub.entity.NotificationType;
import com.alumnihub.entity.User;
import com.alumnihub.exception.InTouchException;
import com.alumnihub.repository.InTouchConnectionRepository;
import com.alumnihub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InTouchService {

    private final InTouchConnectionRepository inTouchConnectionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public void sendRequest(String senderEmail, UUID targetUserId) {
        log.info("Processing In-Touch request from {} to target user {}", senderEmail, targetUserId);
        
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> {
                    log.warn("In-Touch request failed: Sender user not found with email {}", senderEmail);
                    return new InTouchException("User not found.", "USER_NOT_FOUND");
                });
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> {
                    log.warn("In-Touch request failed: Target user not found with ID {}", targetUserId);
                    return new InTouchException("User not found.", "USER_NOT_FOUND");
                });

        if (sender.getId().equals(targetUserId)) {
            log.warn("In-Touch request failed: User {} tried to connect with themselves.", sender.getId());
            throw new InTouchException("You cannot send a request to yourself.", "SELF_REQUEST");
        }

        Optional<InTouchConnection> existing = inTouchConnectionRepository.findConnectionBetween(sender.getId(), targetUserId);
        if (existing.isPresent()) {
            InTouchConnection conn = existing.get();
            if ("ACCEPTED".equals(conn.getStatus())) {
                log.warn("In-Touch request failed: Users {} and {} are already connected.", sender.getId(), targetUserId);
                throw new InTouchException("You're already connected.", "ALREADY_CONNECTED");
            } else if ("PENDING".equals(conn.getStatus())) {
                log.warn("In-Touch request failed: A request is already pending between {} and {}.", sender.getId(), targetUserId);
                throw new InTouchException("Request already pending.", "REQUEST_PENDING");
            } else {
                log.info("Re-opening previously rejected/cancelled In-Touch request between {} and {}.", sender.getId(), targetUserId);
                conn.setStatus("PENDING");
                conn.setUser(sender);
                conn.setTargetUser(target);
                inTouchConnectionRepository.save(conn);
            }
        } else {
            log.info("Creating new pending In-Touch connection between {} and {}.", sender.getId(), targetUserId);
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
        log.info("In-Touch request sent successfully from {} to {}", sender.getId(), targetUserId);
    }

    public void cancelRequest(String senderEmail, UUID targetUserId) {
        log.info("Processing In-Touch cancel request from {} for target user {}", senderEmail, targetUserId);

        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> {
                    log.warn("In-Touch cancel failed: Sender not found with email {}", senderEmail);
                    return new InTouchException("User not found.", "USER_NOT_FOUND");
                });

        InTouchConnection conn = inTouchConnectionRepository.findConnectionBetween(sender.getId(), targetUserId)
                .orElseThrow(() -> {
                    log.warn("In-Touch cancel failed: No relationship exists between {} and target {}", sender.getId(), targetUserId);
                    return new InTouchException("No relationship exists.", "INVALID_REQUEST");
                });

        if (!"PENDING".equals(conn.getStatus())) {
            log.warn("In-Touch cancel failed: Request is not pending (status is {}) between {} and {}", conn.getStatus(), sender.getId(), targetUserId);
            throw new InTouchException("Connection request is not pending.", "INVALID_REQUEST");
        }
        if (!conn.getUser().getId().equals(sender.getId())) {
            log.warn("In-Touch cancel failed: User {} is not the sender of the request to {}", sender.getId(), targetUserId);
            throw new InTouchException("You are not the sender of this request.", "INVALID_REQUEST");
        }

        inTouchConnectionRepository.delete(conn);
        log.info("In-Touch request from {} to {} successfully cancelled.", sender.getId(), targetUserId);
    }

    public void acceptRequest(String receiverEmail, UUID senderUserId) {
        log.info("Processing In-Touch accept request from {} for sender user {}", receiverEmail, senderUserId);

        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> {
                    log.warn("In-Touch accept failed: Receiver not found with email {}", receiverEmail);
                    return new InTouchException("User not found.", "USER_NOT_FOUND");
                });

        InTouchConnection conn = inTouchConnectionRepository.findConnectionBetween(receiver.getId(), senderUserId)
                .orElseThrow(() -> {
                    log.warn("In-Touch accept failed: No relationship exists between {} and sender {}", receiver.getId(), senderUserId);
                    return new InTouchException("No relationship exists.", "INVALID_REQUEST");
                });

        if (!"PENDING".equals(conn.getStatus())) {
            log.warn("In-Touch accept failed: Connection request is not pending (status is {}) between {} and {}", conn.getStatus(), receiver.getId(), senderUserId);
            throw new InTouchException("Connection request is not pending.", "INVALID_REQUEST");
        }
        if (!conn.getTargetUser().getId().equals(receiver.getId())) {
            log.warn("In-Touch accept failed: User {} is not the target of the request from {}", receiver.getId(), senderUserId);
            throw new InTouchException("You are not the target of this request.", "INVALID_REQUEST");
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
        log.info("In-Touch request from {} successfully accepted by {}", senderUserId, receiver.getId());
    }

    public void rejectRequest(String receiverEmail, UUID senderUserId) {
        log.info("Processing In-Touch reject request from {} for sender user {}", receiverEmail, senderUserId);

        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> {
                    log.warn("In-Touch reject failed: Receiver not found with email {}", receiverEmail);
                    return new InTouchException("User not found.", "USER_NOT_FOUND");
                });

        InTouchConnection conn = inTouchConnectionRepository.findConnectionBetween(receiver.getId(), senderUserId)
                .orElseThrow(() -> {
                    log.warn("In-Touch reject failed: No relationship exists between {} and sender {}", receiver.getId(), senderUserId);
                    return new InTouchException("No relationship exists.", "INVALID_REQUEST");
                });

        if (!"PENDING".equals(conn.getStatus())) {
            log.warn("In-Touch reject failed: Request is not pending (status is {}) between {} and {}", conn.getStatus(), receiver.getId(), senderUserId);
            throw new InTouchException("Connection request is not pending.", "INVALID_REQUEST");
        }
        if (!conn.getTargetUser().getId().equals(receiver.getId())) {
            log.warn("In-Touch reject failed: User {} is not the target of request from {}", receiver.getId(), senderUserId);
            throw new InTouchException("You are not the target of this request.", "INVALID_REQUEST");
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
        log.info("In-Touch request from {} successfully rejected by {}", senderUserId, receiver.getId());
    }

    public void removeConnection(String userEmail, UUID targetUserId) {
        log.info("Processing In-Touch remove request from {} for target user {}", userEmail, targetUserId);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> {
                    log.warn("In-Touch remove failed: User not found with email {}", userEmail);
                    return new InTouchException("User not found.", "USER_NOT_FOUND");
                });

        InTouchConnection conn = inTouchConnectionRepository.findConnectionBetween(user.getId(), targetUserId)
                .orElseThrow(() -> {
                    log.warn("In-Touch remove failed: No relationship exists between {} and {}", user.getId(), targetUserId);
                    return new InTouchException("No relationship exists.", "INVALID_REQUEST");
                });

        if (!"ACCEPTED".equals(conn.getStatus())) {
            log.warn("In-Touch remove failed: Users {} and {} are not in touch (status is {})", user.getId(), targetUserId, conn.getStatus());
            throw new InTouchException("You are not in touch with this user.", "INVALID_REQUEST");
        }

        inTouchConnectionRepository.delete(conn);
        log.info("In-Touch connection between {} and {} successfully removed.", user.getId(), targetUserId);
    }
}
