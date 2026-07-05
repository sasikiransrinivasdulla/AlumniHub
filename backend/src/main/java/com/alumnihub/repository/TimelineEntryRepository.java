package com.alumnihub.repository;

import com.alumnihub.entity.TimelineEntry;
import com.alumnihub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface TimelineEntryRepository extends JpaRepository<TimelineEntry, UUID> {
    List<TimelineEntry> findAllByUserOrderByYearAsc(User user);
    List<TimelineEntry> findAllByUserIdOrderByYearAsc(UUID userId);
}
