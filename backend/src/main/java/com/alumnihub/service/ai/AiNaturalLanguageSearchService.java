package com.alumnihub.service.ai;

import com.alumnihub.entity.User;
import java.util.List;

public interface AiNaturalLanguageSearchService {
    List<User> searchSemantic(String nlQuery, User requester);
}
