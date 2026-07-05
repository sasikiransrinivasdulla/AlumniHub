package com.alumnihub.service.ai.impl;

import com.alumnihub.entity.User;
import com.alumnihub.service.ai.AiCareerSuggestionService;
import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.List;

@Service
public class AiCareerSuggestionServiceImpl implements AiCareerSuggestionService {
    @Override
    public List<String> suggestCareerPaths(User user) {
        // AI Placeholder logic: to be populated in future releases
        return Collections.emptyList();
    }
}
