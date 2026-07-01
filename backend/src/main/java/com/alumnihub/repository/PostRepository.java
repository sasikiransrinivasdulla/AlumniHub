package com.alumnihub.repository;

import com.alumnihub.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {
    
    // For CST and ECT: filter by batch and department
    List<Post> findAllByUserBatchAndUserDepartmentOrderByCreatedAtDesc(String batch, String department);

    // For CSE, ECE, EEE, MECH, CIVIL, AIML, CAI: filter by batch, department, and section
    List<Post> findAllByUserBatchAndUserDepartmentAndUserSectionOrderByCreatedAtDesc(String batch, String department, String section);
}
