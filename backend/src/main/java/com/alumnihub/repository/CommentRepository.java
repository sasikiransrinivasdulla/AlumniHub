package com.alumnihub.repository;

import com.alumnihub.entity.Comment;
import com.alumnihub.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findAllByPostOrderByCreatedAtDesc(Post post);
}
