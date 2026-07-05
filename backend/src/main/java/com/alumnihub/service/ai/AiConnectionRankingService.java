package com.alumnihub.service.ai;

import com.alumnihub.entity.User;
import java.util.List;

public interface AiConnectionRankingService {
    List<User> rankConnections(User user, List<User> candidates);
}
