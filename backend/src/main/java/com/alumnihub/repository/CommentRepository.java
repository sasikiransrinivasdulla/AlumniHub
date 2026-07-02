package com.alumnihub.repository;

import com.alumnihub.entity.Comment;
import com.alumnihub.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    @Query(value = "select c from Comment c join fetch c.user u where c.post = :post order by c.createdAt desc",
           countQuery = "select count(c) from Comment c where c.post = :post")
    org.springframework.data.domain.Page<Comment> findAllByPostOrderByCreatedAtDesc(
            @Param("post") Post post, 
            org.springframework.data.domain.Pageable pageable);
}
