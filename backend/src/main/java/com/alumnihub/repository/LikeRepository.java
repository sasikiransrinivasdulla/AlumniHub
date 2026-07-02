package com.alumnihub.repository;

import com.alumnihub.entity.Like;
import com.alumnihub.entity.Post;
import com.alumnihub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LikeRepository extends JpaRepository<Like, UUID> {
    Optional<Like> findByPostAndUser(Post post, User user);
    boolean existsByPostAndUser(Post post, User user);

    Optional<Like> findByUserAndPost(User user, Post post);
    boolean existsByUserAndPost(User user, Post post);

    @Query("select l.post.id from Like l where l.user = :user and l.post.id in :postIds")
    java.util.Set<UUID> findLikedPostIdsByUserAndPostIds(
            @Param("user") User user, 
            @Param("postIds") java.util.Collection<UUID> postIds);
}
