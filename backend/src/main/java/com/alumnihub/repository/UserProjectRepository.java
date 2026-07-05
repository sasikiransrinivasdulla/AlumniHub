package com.alumnihub.repository;

import com.alumnihub.entity.UserProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface UserProjectRepository extends JpaRepository<UserProject, UUID> {
}
