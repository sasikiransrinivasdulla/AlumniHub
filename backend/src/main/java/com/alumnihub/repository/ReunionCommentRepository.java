package com.alumnihub.repository;

import com.alumnihub.entity.ReunionComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ReunionCommentRepository extends JpaRepository<ReunionComment, UUID> {
}
