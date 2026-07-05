package com.alumnihub.service.ai.impl;

import com.alumnihub.entity.User;
import com.alumnihub.service.ai.AiNaturalLanguageSearchService;
import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.List;

@Service
public class AiNaturalLanguageSearchServiceImpl implements AiNaturalLanguageSearchService {
    @Override
    public List<User> searchSemantic(String nlQuery, User requester) {
        // AI Placeholder logic: to be populated in future releases
        return Collections.emptyList();
    }
}
