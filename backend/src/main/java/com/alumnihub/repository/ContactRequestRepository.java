package com.alumnihub.repository;

import com.alumnihub.entity.ContactRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContactRequestRepository extends JpaRepository<ContactRequest, UUID> {

    @Query("SELECT r FROM ContactRequest r WHERE r.requester.id = :requesterId AND r.owner.id = :ownerId")
    Optional<ContactRequest> findRequest(@Param("requesterId") UUID requesterId, @Param("ownerId") UUID ownerId);

    @Query("SELECT r FROM ContactRequest r WHERE (r.requester.id = :u1 AND r.owner.id = :u2) OR (r.requester.id = :u2 AND r.owner.id = :u1)")
    Optional<ContactRequest> findRequestBetween(@Param("u1") UUID u1, @Param("u2") UUID u2);

    @Query("SELECT COUNT(r) > 0 FROM ContactRequest r WHERE r.status = 'ACCEPTED' AND r.requester.id = :requesterId AND r.owner.id = :ownerId")
    boolean existsAcceptedRequest(@Param("requesterId") UUID requesterId, @Param("ownerId") UUID ownerId);

    @Query("SELECT r FROM ContactRequest r WHERE r.status = 'PENDING' AND r.owner.id = :userId")
    List<ContactRequest> findPendingRequestsReceived(@Param("userId") UUID userId);
}
