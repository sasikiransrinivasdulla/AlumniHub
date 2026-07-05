package com.alumnihub.repository;

import com.alumnihub.entity.UserCertification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface UserCertificationRepository extends JpaRepository<UserCertification, UUID> {
}
