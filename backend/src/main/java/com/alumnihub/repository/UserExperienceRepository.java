package com.alumnihub.repository;

import com.alumnihub.entity.UserExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface UserExperienceRepository extends JpaRepository<UserExperience, UUID> {
}
