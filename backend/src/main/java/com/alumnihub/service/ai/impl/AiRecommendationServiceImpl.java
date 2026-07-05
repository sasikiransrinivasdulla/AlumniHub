package com.alumnihub.service.ai.impl;

import com.alumnihub.entity.User;
import com.alumnihub.service.ai.AiRecommendationService;
import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.List;

@Service
public class AiRecommendationServiceImpl implements AiRecommendationService {
    @Override
    public List<User> recommendClassmates(User user, int limit) {
        // AI Placeholder logic: to be populated in future releases
        return Collections.emptyList();
    }
}
