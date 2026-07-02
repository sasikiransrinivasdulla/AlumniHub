package com.alumnihub.repository;

import com.alumnihub.entity.Post;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Post p where p.id = :id")
    Optional<Post> findByIdForUpdate(@Param("id") UUID id);
    
    // For CST and ECT: filter by batch and department
    List<Post> findAllByUserBatchAndUserDepartmentOrderByCreatedAtDesc(String batch, String department);

    // For CSE, ECE, EEE, MECH, CIVIL, AIML, CAI: filter by batch, department, and section
    List<Post> findAllByUserBatchAndUserDepartmentAndUserSectionOrderByCreatedAtDesc(String batch, String department, String section);
}
