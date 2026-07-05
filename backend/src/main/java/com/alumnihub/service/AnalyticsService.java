package com.alumnihub.service;

import com.alumnihub.dto.AnalyticsDto;
import com.alumnihub.entity.*;
import com.alumnihub.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    @PersistenceContext
    private final EntityManager entityManager;
    private final UserRepository userRepository;
    private final InTouchConnectionRepository inTouchConnectionRepository;

    @Transactional
    public AnalyticsDto getAnalytics(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        UUID userId = user.getId();

        // 1. Accepted connections count
        long connectionsCount = inTouchConnectionRepository.findAllAcceptedConnectionsForUser(userId).size();

        // 2. User's posts/memories count
        long memoriesCount = entityManager.createQuery(
                "SELECT COUNT(p) FROM Post p WHERE p.user.id = :userId", Long.class)
                .setParameter("userId", userId)
                .getSingleResult();

        // 3. Profile Views & Search Appearances
        long profileViewsCount = user.getProfileViews() != null ? user.getProfileViews() : 0L;
        long searchAppearancesCount = user.getSearchAppearances() != null ? user.getSearchAppearances() : 0L;

        // 4. Likes received on all posts of user
        long likesReceivedCount = entityManager.createQuery(
                "SELECT COUNT(l) FROM Like l WHERE l.post.user.id = :userId", Long.class)
                .setParameter("userId", userId)
                .getSingleResult();

        // 5. Comments received on all posts of user
        long commentsReceivedCount = entityManager.createQuery(
                "SELECT COUNT(c) FROM Comment c WHERE c.post.user.id = :userId", Long.class)
                .setParameter("userId", userId)
                .getSingleResult();

        // 6. Most Active Month
        List<Object[]> activeMonths = entityManager.createQuery(
                "SELECT FUNCTION('TO_CHAR', p.createdAt, 'YYYY-MM'), COUNT(p) " +
                "FROM Post p WHERE p.user.id = :userId " +
                "GROUP BY FUNCTION('TO_CHAR', p.createdAt, 'YYYY-MM') " +
                "ORDER BY COUNT(p) DESC", Object[].class)
                .setParameter("userId", userId)
                .getResultList();

        String mostActiveMonth = "No posts yet";
        if (!activeMonths.isEmpty()) {
            mostActiveMonth = (String) activeMonths.get(0)[0];
        }

        // 7. Connection growth trend (aggregated by month)
        List<InTouchConnection> connections = inTouchConnectionRepository.findAllAcceptedConnectionsForUser(userId);
        Map<String, Long> connectionGrowth = new TreeMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");
        for (InTouchConnection c : connections) {
            String month = c.getConnectedAt() != null
                    ? c.getConnectedAt().format(formatter)
                    : LocalDateTime.now().format(formatter);
            connectionGrowth.put(month, connectionGrowth.getOrDefault(month, 0L) + 1);
        }

        // 8. Profile views trend (aggregated by month)
        List<ProfileViewLog> logs = entityManager.createQuery(
                "SELECT p FROM ProfileViewLog p WHERE p.viewedUser.id = :userId", ProfileViewLog.class)
                .setParameter("userId", userId)
                .getResultList();

        Map<String, Long> profileViewsTrend = new TreeMap<>();
        for (ProfileViewLog log : logs) {
            String month = log.getViewedAt().format(formatter);
            profileViewsTrend.put(month, profileViewsTrend.getOrDefault(month, 0L) + 1);
        }

        // If maps are empty, put current month as mock value to ensure beautiful rendering
        String currentMonthStr = LocalDateTime.now().format(formatter);
        if (connectionGrowth.isEmpty()) {
            connectionGrowth.put(currentMonthStr, 0L);
        }
        if (profileViewsTrend.isEmpty()) {
            profileViewsTrend.put(currentMonthStr, 0L);
        }

        return AnalyticsDto.builder()
                .connectionsCount(connectionsCount)
                .memoriesCount(memoriesCount)
                .profileViewsCount(profileViewsCount)
                .searchAppearancesCount(searchAppearancesCount)
                .likesReceivedCount(likesReceivedCount)
                .commentsReceivedCount(commentsReceivedCount)
                .mostActiveMonth(mostActiveMonth)
                .connectionGrowth(connectionGrowth)
                .profileViewsTrend(profileViewsTrend)
                .build();
    }
}
