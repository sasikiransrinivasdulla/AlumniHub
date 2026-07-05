package com.alumnihub.service.ai;

import com.alumnihub.entity.User;
import java.util.List;

public interface AiRecommendationService {
    List<User> recommendClassmates(User user, int limit);
}
