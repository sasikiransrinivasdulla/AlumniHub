package com.alumnihub.repository;

import com.alumnihub.entity.Achievement;
import com.alumnihub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, UUID> {
    List<Achievement> findAllByUser(User user);
}
