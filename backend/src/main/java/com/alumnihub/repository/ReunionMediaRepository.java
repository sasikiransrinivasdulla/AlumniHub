package com.alumnihub.repository;

import com.alumnihub.entity.ReunionMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ReunionMediaRepository extends JpaRepository<ReunionMedia, UUID> {
}
