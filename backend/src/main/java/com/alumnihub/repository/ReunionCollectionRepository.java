package com.alumnihub.repository;

import com.alumnihub.entity.ReunionCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ReunionCollectionRepository extends JpaRepository<ReunionCollection, UUID> {
}
