package com.alumnihub.service.ai;

import com.alumnihub.entity.User;
import java.util.List;

public interface AiCareerSuggestionService {
    List<String> suggestCareerPaths(User user);
}
