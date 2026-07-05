package com.alumnihub.repository;

import com.alumnihub.entity.MentorshipRequest;
import com.alumnihub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface MentorshipRequestRepository extends JpaRepository<MentorshipRequest, UUID> {
    List<MentorshipRequest> findAllByMentor(User mentor);
    List<MentorshipRequest> findAllByMentee(User mentee);
}
