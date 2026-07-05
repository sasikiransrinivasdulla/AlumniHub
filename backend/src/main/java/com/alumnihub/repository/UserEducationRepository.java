package com.alumnihub.repository;

import com.alumnihub.entity.UserEducation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface UserEducationRepository extends JpaRepository<UserEducation, UUID> {
}
