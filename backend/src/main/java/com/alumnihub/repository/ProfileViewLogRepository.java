package com.alumnihub.repository;

import com.alumnihub.entity.ProfileViewLog;
import com.alumnihub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProfileViewLogRepository extends JpaRepository<ProfileViewLog, UUID> {
    List<ProfileViewLog> findAllByViewedUser(User viewedUser);
}
