package com.alumnihub.repository;

import com.alumnihub.entity.Notification;
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
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query(value = "select n from Notification n join fetch n.sender join fetch n.recipient where n.recipient = :recipient order by n.createdAt desc",
           countQuery = "select count(n) from Notification n where n.recipient = :recipient")
    Page<Notification> findAllByRecipientOrderByCreatedAtDesc(@Param("recipient") User recipient, Pageable pageable);

    long countByRecipientAndIsReadFalse(User recipient);

    @Modifying
    @Query("update Notification n set n.isRead = true where n.recipient = :recipient and n.isRead = false")
    void markAllAsReadForRecipient(@Param("recipient") User recipient);
}
