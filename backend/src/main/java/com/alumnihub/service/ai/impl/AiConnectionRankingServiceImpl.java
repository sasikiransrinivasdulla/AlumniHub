package com.alumnihub.service.ai.impl;

import com.alumnihub.entity.User;
import com.alumnihub.service.ai.AiConnectionRankingService;
import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.List;

@Service
public class AiConnectionRankingServiceImpl implements AiConnectionRankingService {
    @Override
    public List<User> rankConnections(User user, List<User> candidates) {
        // AI Placeholder logic: to be populated in future releases
        return Collections.emptyList();
    }
}
