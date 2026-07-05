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
    @Query(value = "select p from Post p join fetch p.user u where u.batch = :batch and u.department = :department order by p.createdAt desc",
           countQuery = "select count(p) from Post p join p.user u where u.batch = :batch and u.department = :department")
    org.springframework.data.domain.Page<Post> findAllByUserBatchAndUserDepartmentOrderByCreatedAtDesc(
            @Param("batch") String batch, 
            @Param("department") String department, 
            org.springframework.data.domain.Pageable pageable);

    // For CSE, ECE, EEE, MECH, CIVIL, AIML, CAI: filter by batch, department, and section
    @Query(value = "select p from Post p join fetch p.user u where u.batch = :batch and u.department = :department and u.section = :section order by p.createdAt desc",
           countQuery = "select count(p) from Post p join p.user u where u.batch = :batch and u.department = :department and u.section = :section")
    org.springframework.data.domain.Page<Post> findAllByUserBatchAndUserDepartmentAndUserSectionOrderByCreatedAtDesc(
            @Param("batch") String batch, 
            @Param("department") String department, 
            @Param("section") String section, 
            org.springframework.data.domain.Pageable pageable);

    @Query("select p from Post p join fetch p.user u where u.batch = :batch and u.department = :department")
    List<Post> findAllByBatchAndDeptList(@Param("batch") String batch, @Param("department") String department);

    @Query("select p from Post p join fetch p.user u where u.batch = :batch and u.department = :department and u.section = :section")
    List<Post> findAllByBatchDeptAndSecList(@Param("batch") String batch, @Param("department") String department, @Param("section") String section);
}
