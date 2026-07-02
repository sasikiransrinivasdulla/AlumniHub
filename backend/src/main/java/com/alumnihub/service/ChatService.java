package com.alumnihub.service;

import com.alumnihub.dto.*;
import com.alumnihub.entity.*;
import com.alumnihub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional
    public ConversationDto getOrCreateConversation(String currentUserEmail, UUID targetUserId) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + currentUserEmail));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        if (currentUser.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("Cannot chat with yourself");
        }

        Conversation conversation = conversationRepository.findBetweenUsers(currentUser, targetUser)
                .orElseGet(() -> {
                    Conversation newConv = Conversation.builder()
                            .user1(currentUser)
                            .user2(targetUser)
                            .build();
                    return conversationRepository.save(newConv);
                });

        return convertToConversationDto(conversation, currentUser);
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> getConversations(String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + currentUserEmail));

        List<Conversation> conversations = conversationRepository.findAllForUser(currentUser);
        return conversations.stream()
                .map(c -> convertToConversationDto(c, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<MessageDto> getMessages(String currentUserEmail, UUID conversationId, Pageable pageable) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + currentUserEmail));
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        // Security check
        if (!conversation.getUser1().getId().equals(currentUser.getId()) &&
            !conversation.getUser2().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("403 Forbidden: You are not a participant in this conversation");
        }

        Page<Message> messages = messageRepository.findByConversationOrderByCreatedAtDesc(conversation, pageable);
        return messages.map(this::convertToMessageDto);
    }

    @Transactional(readOnly = true)
    public MessageDto prepareMessage(String currentUserEmail, UUID conversationId, MessageSendDto sendDto, UUID generatedId, LocalDateTime createdAt) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + currentUserEmail));
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        if (!conversation.getUser1().getId().equals(currentUser.getId()) &&
            !conversation.getUser2().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("403 Forbidden: You are not a participant in this conversation");
        }

        return MessageDto.builder()
                .id(generatedId)
                .conversationId(conversationId)
                .senderId(currentUser.getId())
                .senderName(currentUser.getFullName())
                .senderProfilePicture(currentUser.getProfilePictureUrl())
                .text(sendDto.getText() != null ? sendDto.getText() : "")
                .imageUrl(sendDto.getImageUrl())
                .createdAt(createdAt)
                .isRead(false)
                .build();
    }

    @org.springframework.scheduling.annotation.Async
    @Transactional
    public void persistMessageAsync(UUID messageId, String currentUserEmail, UUID conversationId, MessageSendDto sendDto, LocalDateTime createdAt) {
        try {
            User currentUser = userRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + currentUserEmail));
            Conversation conversation = conversationRepository.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

            Message message = Message.builder()
                    .id(messageId)
                    .conversation(conversation)
                    .sender(currentUser)
                    .text(sendDto.getText() != null ? sendDto.getText() : "")
                    .imageUrl(sendDto.getImageUrl())
                    .isRead(false)
                    .createdAt(createdAt)
                    .build();

            messageRepository.save(message);

            conversation.setUpdatedAt(createdAt);
            conversationRepository.save(conversation);

            // Trigger notification
            User recipient = conversation.getUser1().getId().equals(currentUser.getId()) ? conversation.getUser2() : conversation.getUser1();
            String msgPreview = message.getText().length() > 40 ? message.getText().substring(0, 37) + "..." : message.getText();
            if (msgPreview.isEmpty() && message.getImageUrl() != null) {
                msgPreview = "[Image Attachment]";
            }
            notificationService.createNotification(
                    recipient,
                    currentUser,
                    NotificationType.MESSAGE,
                    conversationId,
                    currentUser.getFullName() + ": " + msgPreview
            );
        } catch (Exception e) {
            // Fail silently or log
        }
    }

    @Transactional
    public MessageDto sendMessage(String currentUserEmail, UUID conversationId, MessageSendDto sendDto) {
        UUID generatedId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        MessageDto dto = prepareMessage(currentUserEmail, conversationId, sendDto, generatedId, now);
        persistMessageAsync(generatedId, currentUserEmail, conversationId, sendDto, now);
        return dto;
    }

    @Transactional
    public void markAsRead(String currentUserEmail, UUID conversationId) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + currentUserEmail));
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        // Security check
        if (!conversation.getUser1().getId().equals(currentUser.getId()) &&
            !conversation.getUser2().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("403 Forbidden: You are not a participant in this conversation");
        }

        messageRepository.markMessagesAsRead(conversation, currentUser);
    }

    @Transactional
    public void deleteMessage(String currentUserEmail, UUID messageId) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + currentUserEmail));
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("403 Forbidden: You can only delete your own messages");
        }

        messageRepository.delete(message);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + currentUserEmail));
        return messageRepository.countAllUnreadForUser(currentUser);
    }

    @Transactional(readOnly = true)
    public ConversationDto getConversationDto(UUID conversationId, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + currentUserEmail));
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        return convertToConversationDto(conversation, currentUser);
    }

    @Transactional(readOnly = true)
    public ConversationDto getConversationDtoWithLastMessage(UUID conversationId, String currentUserEmail, MessageDto lastMessage) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + currentUserEmail));
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        User targetUser = conversation.getUser1().getId().equals(currentUser.getId()) ? conversation.getUser2() : conversation.getUser1();
        long unread = messageRepository.countUnreadMessages(conversation, currentUser);

        return ConversationDto.builder()
                .id(conversation.getId())
                .participant(convertToUserDto(targetUser))
                .lastMessageText(lastMessage.getText())
                .lastMessageImageUrl(lastMessage.getImageUrl())
                .lastMessageTime(lastMessage.getCreatedAt())
                .unreadCount(unread)
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }

    private ConversationDto convertToConversationDto(Conversation c, User currentUser) {
        User targetUser = c.getUser1().getId().equals(currentUser.getId()) ? c.getUser2() : c.getUser1();

        // Fetch last message
        Page<Message> lastMsgs = messageRepository.findByConversationOrderByCreatedAtDesc(c, PageRequest.of(0, 1));
        String lastMsgText = null;
        String lastMsgImageUrl = null;
        LocalDateTime lastMsgTime = null;

        if (!lastMsgs.isEmpty()) {
            Message m = lastMsgs.getContent().get(0);
            lastMsgText = m.getText();
            lastMsgImageUrl = m.getImageUrl();
            lastMsgTime = m.getCreatedAt();
        }

        long unread = messageRepository.countUnreadMessages(c, currentUser);

        return ConversationDto.builder()
                .id(c.getId())
                .participant(convertToUserDto(targetUser))
                .lastMessageText(lastMsgText)
                .lastMessageImageUrl(lastMsgImageUrl)
                .lastMessageTime(lastMsgTime)
                .unreadCount(unread)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private MessageDto convertToMessageDto(Message m) {
        return MessageDto.builder()
                .id(m.getId())
                .conversationId(m.getConversation().getId())
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getFullName())
                .senderProfilePicture(m.getSender().getProfilePictureUrl())
                .text(m.getText())
                .imageUrl(m.getImageUrl())
                .createdAt(m.getCreatedAt())
                .isRead(m.getIsRead())
                .build();
    }

    private UserDto convertToUserDto(User u) {
        return UserDto.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .profilePicture(u.getProfilePictureUrl())
                .batch(u.getBatch())
                .department(u.getDepartment())
                .section(u.getSection())
                .currentPosition(u.getCurrentPosition())
                .build();
    }
}
