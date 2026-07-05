package com.alumnihub.repository;

import com.alumnihub.entity.InTouchConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InTouchConnectionRepository extends JpaRepository<InTouchConnection, UUID> {

    @Query("SELECT c FROM InTouchConnection c WHERE (c.user.id = :u1 AND c.targetUser.id = :u2) OR (c.user.id = :u2 AND c.targetUser.id = :u1)")
    Optional<InTouchConnection> findConnectionBetween(@Param("u1") UUID u1, @Param("u2") UUID u2);

    @Query("SELECT COUNT(c) > 0 FROM InTouchConnection c WHERE c.status = 'ACCEPTED' AND ((c.user.id = :u1 AND c.targetUser.id = :u2) OR (c.user.id = :u2 AND c.targetUser.id = :u1))")
    boolean existsAcceptedConnection(@Param("u1") UUID u1, @Param("u2") UUID u2);

    @Query("SELECT c FROM InTouchConnection c WHERE c.status = 'ACCEPTED' AND (c.user.id = :userId OR c.targetUser.id = :userId)")
    List<InTouchConnection> findAllAcceptedConnectionsForUser(@Param("userId") UUID userId);

    @Query("SELECT c FROM InTouchConnection c WHERE c.status = 'PENDING' AND c.targetUser.id = :userId")
    List<InTouchConnection> findPendingRequestsReceived(@Param("userId") UUID userId);

    @Query("SELECT c FROM InTouchConnection c WHERE c.status = 'PENDING' AND c.user.id = :userId")
    List<InTouchConnection> findPendingRequestsSent(@Param("userId") UUID userId);
}
