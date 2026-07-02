package com.alumnihub.repository;

import com.alumnihub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByFirebaseUid(String firebaseUid);

    // CST/ECT Visibility Queries
    List<User> findAllByBatchAndDepartmentAndProfileCompletedTrue(String batch, String department);

    @Query("SELECT u FROM User u WHERE u.batch = :batch AND u.department = :department AND u.profileCompleted = true " +
           "AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.currentPosition) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<User> searchCstEctAlumni(@Param("batch") String batch, @Param("department") String department, @Param("query") String query);

    // Other Branches Visibility Queries
    List<User> findAllByBatchAndDepartmentAndSectionAndProfileCompletedTrue(String batch, String department, String section);

    @Query("SELECT u FROM User u WHERE u.batch = :batch AND u.department = :department AND u.section = :section AND u.profileCompleted = true " +
           "AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.currentPosition) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<User> searchOtherAlumni(@Param("batch") String batch, @Param("department") String department, @Param("section") String section, @Param("query") String query);
}
