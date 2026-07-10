package com.alumnihub.controller;

import com.alumnihub.dto.*;
import com.alumnihub.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate simpMessagingTemplate;

    @PostMapping("/conversations")
    public ResponseEntity<ConversationDto> getOrCreateConversation(
            Principal principal,
            @RequestParam("targetUserId") UUID targetUserId) {
        ConversationDto conversation = chatService.getOrCreateConversation(principal.getName(), targetUserId);
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<ConversationDto> getConversation(
            Principal principal,
            @PathVariable("id") UUID conversationId) {
        ConversationDto conversation = chatService.getConversationDto(conversationId, principal.getName());
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDto>> getConversations(Principal principal) {
        List<ConversationDto> list = chatService.getConversations(principal.getName());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<Page<MessageDto>> getMessages(
            Principal principal,
            @PathVariable("id") UUID conversationId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<MessageDto> messages = chatService.getMessages(principal.getName(), conversationId, pageable);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<MessageDto> sendMessage(
            Principal principal,
            @PathVariable("id") UUID conversationId,
            @Valid @RequestBody MessageSendDto sendDto) {

        MessageDto message = chatService.sendMessage(principal.getName(), conversationId, sendDto);

        // 1. Broadcast the message to the conversation room
        simpMessagingTemplate.convertAndSend("/topic/conversations/" + conversationId, message);

        // 2. Broadcast updated conversation status to both users' private inbox topics
        try {
            ConversationDto senderConv = chatService.getConversationDtoWithLastMessage(conversationId, principal.getName(), message);
            String recipientEmail = senderConv.getParticipant().getEmail();
            ConversationDto recipientConv = chatService.getConversationDtoWithLastMessage(conversationId, recipientEmail, message);

            UUID senderUserId = recipientConv.getParticipant().getId();
            UUID recipientUserId = senderConv.getParticipant().getId();

            simpMessagingTemplate.convertAndSend("/topic/users/" + senderUserId + "/inbox", senderConv);
            simpMessagingTemplate.convertAndSend("/topic/users/" + recipientUserId + "/inbox", recipientConv);
        } catch (Exception e) {
            // Fail silently
        }

        return ResponseEntity.ok(message);
    }

    @PostMapping("/conversations/{id}/read")
    public ResponseEntity<Void> markAsRead(Principal principal, @PathVariable("id") UUID conversationId) {
        chatService.markAsRead(principal.getName(), conversationId);

        // Broadcast to the conversation room that messages are read
        simpMessagingTemplate.convertAndSend("/topic/conversations/" + conversationId + "/read", true);

        // Update inboxes for unread badge counts
        try {
            ConversationDto senderConv = chatService.getConversationDto(conversationId, principal.getName());
            String recipientEmail = senderConv.getParticipant().getEmail();
            ConversationDto recipientConv = chatService.getConversationDto(conversationId, recipientEmail);

            UUID senderUserId = recipientConv.getParticipant().getId();
            UUID recipientUserId = senderConv.getParticipant().getId();

            simpMessagingTemplate.convertAndSend("/topic/users/" + senderUserId + "/inbox", senderConv);
            simpMessagingTemplate.convertAndSend("/topic/users/" + recipientUserId + "/inbox", recipientConv);
        } catch (Exception e) {
            // Fail silently
        }

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/messages/{id}")
    public ResponseEntity<Void> deleteMessage(Principal principal, @PathVariable("id") UUID messageId) {
        // Find message and conversation id first to broadcast deletion
        chatService.deleteMessage(principal.getName(), messageId);
        
        // Return success
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(Principal principal) {
        long count = chatService.getUnreadCount(principal.getName());
        return ResponseEntity.ok(count);
    }
}
