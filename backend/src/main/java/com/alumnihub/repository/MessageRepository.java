package com.alumnihub.repository;

import com.alumnihub.entity.Conversation;
import com.alumnihub.entity.Message;
import com.alumnihub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    Page<Message> findByConversationOrderByCreatedAtDesc(Conversation conversation, Pageable pageable);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation = :conversation AND m.sender <> :user AND m.isRead = false")
    long countUnreadMessages(@Param("conversation") Conversation conversation, @Param("user") User user);

    @Query("SELECT COUNT(m) FROM Message m WHERE (m.conversation.user1 = :user OR m.conversation.user2 = :user) AND m.sender <> :user AND m.isRead = false")
    long countAllUnreadForUser(@Param("user") User user);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.conversation = :conversation AND m.sender <> :user AND m.isRead = false")
    void markMessagesAsRead(@Param("conversation") Conversation conversation, @Param("user") User user);
}
