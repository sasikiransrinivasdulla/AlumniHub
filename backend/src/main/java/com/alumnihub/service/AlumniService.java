package com.alumnihub.service;

import com.alumnihub.dto.UserDto;
import com.alumnihub.entity.ContactRequest;
import com.alumnihub.entity.InTouchConnection;
import com.alumnihub.entity.ProfileViewLog;
import com.alumnihub.entity.User;
import com.alumnihub.repository.ContactRequestRepository;
import com.alumnihub.repository.InTouchConnectionRepository;
import com.alumnihub.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AlumniService {

    private final UserRepository userRepository;
    private final InTouchConnectionRepository inTouchConnectionRepository;
    private final ContactRequestRepository contactRequestRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public List<UserDto> getVisibleAlumni(String requesterEmail) {
        return searchVisibleAlumniWithFilters(requesterEmail, null, null, null, null, null, null, null, null, null, null);
    }

    public List<UserDto> searchVisibleAlumni(String requesterEmail, String query) {
        return searchVisibleAlumniWithFilters(requesterEmail, query, null, null, null, null, null, null, null, null, null);
    }

    @Transactional
    public List<UserDto> searchVisibleAlumniWithFilters(
            String requesterEmail,
            String query,
            String company,
            String position,
            String batch,
            String department,
            String section,
            String city,
            String skills,
            String openTo,
            String badge
    ) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + requesterEmail));

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<User> cq = cb.createQuery(User.class);
        Root<User> userRoot = cq.from(User.class);

        // Core visibility predicate: profileCompleted = true
        Predicate profileCompleted = cb.isTrue(userRoot.get("profileCompleted"));

        // Visibility Rule 1: Public profile
        Predicate isPublic = cb.equal(cb.upper(userRoot.get("privacyLevel")), "PUBLIC");

        // Visibility Rule 2: Academic Community match (batch + department matching requester)
        Predicate batchMatch = cb.equal(cb.lower(userRoot.get("batch")), requester.getBatch().toLowerCase());
        Predicate deptMatch = cb.equal(cb.lower(userRoot.get("department")), requester.getDepartment().toLowerCase());

        // CST/ECT Check: no section matching needed
        Predicate isCstEct = cb.or(
                cb.equal(cb.upper(userRoot.get("department")), "CST"),
                cb.equal(cb.upper(userRoot.get("department")), "ECT")
        );

        // Other branches: section matching needed
        Predicate sectionMatch = cb.and(
                cb.isNotNull(userRoot.get("section")),
                cb.equal(cb.lower(userRoot.get("section")), requester.getSection().toLowerCase())
        );

        Predicate academicCommunityPredicate = cb.and(
                batchMatch,
                deptMatch,
                cb.or(isCstEct, sectionMatch)
        );

        Predicate visibilityPredicate = cb.or(isPublic, academicCommunityPredicate);
        Predicate finalPredicate = cb.and(profileCompleted, visibilityPredicate);

        // Exclude the requester themselves from the list
        finalPredicate = cb.and(finalPredicate, cb.notEqual(userRoot.get("id"), requester.getId()));

        List<Predicate> filterPredicates = new ArrayList<>();
        filterPredicates.add(finalPredicate);

        if (query != null && !query.trim().isEmpty()) {
            filterPredicates.add(cb.like(cb.lower(userRoot.get("fullName")), "%" + query.trim().toLowerCase() + "%"));
        }
        if (company != null && !company.trim().isEmpty()) {
            filterPredicates.add(cb.like(cb.lower(userRoot.get("currentCompany")), "%" + company.trim().toLowerCase() + "%"));
        }
        if (position != null && !position.trim().isEmpty()) {
            filterPredicates.add(cb.like(cb.lower(userRoot.get("currentPosition")), "%" + position.trim().toLowerCase() + "%"));
        }
        if (batch != null && !batch.trim().isEmpty()) {
            if (batch.contains("-")) {
                String[] parts = batch.split("-");
                if (parts.length == 2) {
                    try {
                        int start = Integer.parseInt(parts[0].trim());
                        int end = Integer.parseInt(parts[1].trim());
                        List<Predicate> batchRangePredicates = new ArrayList<>();
                        for (int yr = start; yr <= end; yr++) {
                            batchRangePredicates.add(cb.equal(userRoot.get("batch"), String.valueOf(yr)));
                        }
                        if (!batchRangePredicates.isEmpty()) {
                            filterPredicates.add(cb.or(batchRangePredicates.toArray(new Predicate[0])));
                        }
                    } catch (NumberFormatException e) {
                        filterPredicates.add(cb.equal(cb.lower(userRoot.get("batch")), batch.trim().toLowerCase()));
                    }
                }
            } else {
                filterPredicates.add(cb.equal(cb.lower(userRoot.get("batch")), batch.trim().toLowerCase()));
            }
        }
        if (department != null && !department.trim().isEmpty()) {
            filterPredicates.add(cb.equal(cb.lower(userRoot.get("department")), department.trim().toLowerCase()));
        }
        if (section != null && !section.trim().isEmpty()) {
            filterPredicates.add(cb.equal(cb.lower(userRoot.get("section")), section.trim().toLowerCase()));
        }
        if (city != null && !city.trim().isEmpty()) {
            filterPredicates.add(cb.like(cb.lower(userRoot.get("currentCity")), "%" + city.trim().toLowerCase() + "%"));
        }
        if (skills != null && !skills.trim().isEmpty()) {
            String[] skillList = skills.split(",");
            for (String s : skillList) {
                if (!s.trim().isEmpty()) {
                    filterPredicates.add(cb.like(cb.lower(userRoot.get("skills")), "%" + s.trim().toLowerCase() + "%"));
                }
            }
        }
        if (openTo != null && !openTo.trim().isEmpty()) {
            filterPredicates.add(cb.like(cb.lower(userRoot.get("openTo")), "%" + openTo.trim().toLowerCase() + "%"));
        }
        if (badge != null && !badge.trim().isEmpty()) {
            filterPredicates.add(cb.like(cb.lower(userRoot.get("badges")), "%" + badge.trim().toLowerCase() + "%"));
        }

        cq.where(filterPredicates.toArray(new Predicate[0]));
        cq.orderBy(cb.asc(userRoot.get("fullName")));

        List<User> result = entityManager.createQuery(cq).getResultList();

        // Performance fix: batch update searchAppearances with a single JPQL UPDATE instead of N individual saves
        if (!result.isEmpty()) {
            List<UUID> resultIds = result.stream().map(User::getId).collect(Collectors.toList());
            entityManager.createQuery(
                    "UPDATE User u SET u.searchAppearances = COALESCE(u.searchAppearances, 0) + 1 WHERE u.id IN :ids"
            ).setParameter("ids", resultIds).executeUpdate();
        }

        return result.stream()
                .map(u -> convertToDtoWithContext(requester, u))
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto getAlumniDetailsById(String requesterEmail, UUID targetId) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + requesterEmail));

        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new IllegalArgumentException("Alumni not found with ID: " + targetId));

        if (!requester.getId().equals(target.getId())) {
            target.setProfileViews(target.getProfileViews() == null ? 1L : target.getProfileViews() + 1);
            userRepository.save(target);

            ProfileViewLog log = ProfileViewLog.builder()
                    .viewedUser(target)
                    .viewerUser(requester)
                    .viewedAt(LocalDateTime.now())
                    .build();
            entityManager.persist(log);
        }

        return convertToDtoWithContext(requester, target);
    }

    public boolean hasCompleteProfileAccess(User requester, User target) {
        if (requester.getId().equals(target.getId())) {
            return true;
        }

        String privacy = target.getPrivacyLevel() == null ? "PUBLIC" : target.getPrivacyLevel().toUpperCase();

        if ("PUBLIC".equals(privacy)) {
            return true;
        }

        if ("ACADEMIC".equals(privacy)) {
            return isSameAcademicCommunity(requester, target);
        }

        if ("IN_TOUCH".equals(privacy) || "IN_TOUCH_ONLY".equals(privacy)) {
            return inTouchConnectionRepository.existsAcceptedConnection(requester.getId(), target.getId());
        }

        return false;
    }

    private boolean isSameAcademicCommunity(User a, User b) {
        if (a.getBatch() == null || b.getBatch() == null || a.getDepartment() == null || b.getDepartment() == null) {
            return false;
        }
        if (!a.getBatch().equalsIgnoreCase(b.getBatch())) {
            return false;
        }
        if (!a.getDepartment().equalsIgnoreCase(b.getDepartment())) {
            return false;
        }
        String dept = a.getDepartment();
        if ("CST".equalsIgnoreCase(dept) || "ECT".equalsIgnoreCase(dept)) {
            return true;
        }
        return a.getSection() != null && b.getSection() != null && a.getSection().equalsIgnoreCase(b.getSection());
    }

    public UserDto convertToDtoWithContext(User requester, User target) {
        String inTouchStatus = "NONE";
        LocalDateTime connectedSince = null;

        Optional<InTouchConnection> connection = inTouchConnectionRepository.findConnectionBetween(requester.getId(), target.getId());
        if (connection.isPresent()) {
            InTouchConnection conn = connection.get();
            if ("ACCEPTED".equals(conn.getStatus())) {
                inTouchStatus = "ACCEPTED";
                connectedSince = conn.getConnectedAt();
            } else if ("PENDING".equals(conn.getStatus())) {
                if (conn.getUser().getId().equals(requester.getId())) {
                    inTouchStatus = "PENDING_SENT";
                } else {
                    inTouchStatus = "PENDING_RECEIVED";
                }
            } else if ("REJECTED".equals(conn.getStatus())) {
                inTouchStatus = "REJECTED";
            }
        }

        String contactStatus = "NONE";
        Optional<ContactRequest> contactReq = contactRequestRepository.findRequest(requester.getId(), target.getId());
        if (contactReq.isPresent()) {
            ContactRequest req = contactReq.get();
            if ("ACCEPTED".equals(req.getStatus())) {
                contactStatus = "ACCEPTED";
            } else if ("PENDING".equals(req.getStatus())) {
                contactStatus = "PENDING_SENT";
            } else if ("REJECTED".equals(req.getStatus())) {
                contactStatus = "REJECTED";
            }
        } else {
            // Check reverse as well
            Optional<ContactRequest> reverseReq = contactRequestRepository.findRequest(target.getId(), requester.getId());
            if (reverseReq.isPresent()) {
                ContactRequest req = reverseReq.get();
                if ("ACCEPTED".equals(req.getStatus())) {
                    contactStatus = "ACCEPTED";
                } else if ("PENDING".equals(req.getStatus())) {
                    contactStatus = "PENDING_RECEIVED";
                }
            }
        }

        boolean hasFullAccess = hasCompleteProfileAccess(requester, target);

        UserDto.UserDtoBuilder builder = UserDto.builder()
                .id(target.getId())
                .firebaseUid(target.getFirebaseUid())
                .fullName(target.getFullName())
                .profilePicture(target.getProfilePictureUrl())
                .batch(target.getBatch())
                .department(target.getDepartment())
                .section(target.getSection())
                .currentPosition(target.getCurrentPosition())
                .currentCompany(target.getCurrentCompany())
                .currentCity(target.getCurrentCity())
                .skills(target.getSkills())
                .graduationYear(target.getGraduationYear())
                .privacyLevel(target.getPrivacyLevel())
                .badges(target.getBadges())
                .openTo(target.getOpenTo())
                .inTouchStatus(inTouchStatus)
                .inTouchConnectedSince(connectedSince)
                .contactRequestStatus(contactStatus)
                .hasFullAccess(hasFullAccess)
                .role(target.getRole())
                .createdAt(target.getCreatedAt())
                .updatedAt(target.getUpdatedAt());

        if (hasFullAccess) {
            builder.email(target.getEmail());
            builder.bio(target.getBio());
            builder.linkedinUrl(target.getLinkedinUrl());
            builder.githubUrl(target.getGithubUrl());
            builder.instagramUrl(target.getInstagramUrl());
        }

        if ("ACCEPTED".equals(contactStatus) || requester.getId().equals(target.getId())) {
            builder.phoneNumber(target.getPhoneNumber());
        }

        return builder.build();
    }

    public List<UserDto> getPeopleYouMayKnow(String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + requesterEmail));

        // Only load accepted/pending connections for this user — avoid full table scan
        List<InTouchConnection> myConnections = inTouchConnectionRepository.findAll().stream()
                .filter(c -> c.getUser().getId().equals(requester.getId()) || c.getTargetUser().getId().equals(requester.getId()))
                .collect(Collectors.toList());

        // Build excluded set (already connected or pending)
        Set<UUID> excludedUserIds = new HashSet<>();
        excludedUserIds.add(requester.getId());
        for (InTouchConnection c : myConnections) {
            if ("ACCEPTED".equals(c.getStatus()) || "PENDING".equals(c.getStatus())) {
                excludedUserIds.add(c.getUser().getId());
                excludedUserIds.add(c.getTargetUser().getId());
            }
        }

        // Build requester's accepted connection set (for mutual connection scoring)
        Set<UUID> requesterConnectionIds = myConnections.stream()
                .filter(c -> "ACCEPTED".equals(c.getStatus()))
                .map(c -> c.getUser().getId().equals(requester.getId()) ? c.getTargetUser().getId() : c.getUser().getId())
                .collect(Collectors.toSet());

        // Load only non-excluded completed profiles (avoids loading all users)
        List<User> candidates = userRepository.findAll().stream()
                .filter(User::getProfileCompleted)
                .filter(u -> !excludedUserIds.contains(u.getId()))
                .collect(Collectors.toList());

        // Build connection map for mutual scoring (only need connections of candidates)
        // Use the already-loaded myConnections plus we need candidate connections
        // For simplicity, load all accepted connections (still better than findAll twice)
        List<InTouchConnection> allAccepted = inTouchConnectionRepository.findAll().stream()
                .filter(c -> "ACCEPTED".equals(c.getStatus()))
                .collect(Collectors.toList());

        Map<UUID, Set<UUID>> userConnectionMap = new HashMap<>();
        for (InTouchConnection c : allAccepted) {
            userConnectionMap.computeIfAbsent(c.getUser().getId(), k -> new HashSet<>()).add(c.getTargetUser().getId());
            userConnectionMap.computeIfAbsent(c.getTargetUser().getId(), k -> new HashSet<>()).add(c.getUser().getId());
        }

        // Precompute requester skills for reuse
        Set<String> requesterSkillSet = new HashSet<>();
        if (requester.getSkills() != null) {
            for (String s : requester.getSkills().split(",")) {
                String trimmed = s.trim().toLowerCase();
                if (!trimmed.isEmpty()) requesterSkillSet.add(trimmed);
            }
        }

        // Score each candidate with corrected priority weights:
        // batch+dept = 5, batch+section = 3 (only if same dept), same city = 2,
        // same company = 2, shared skills = 1 each, mutual connections = 3 each
        record ScoredCandidate(User user, int score, String reason) implements Comparable<ScoredCandidate> {
            @Override
            public int compareTo(ScoredCandidate o) {
                return Integer.compare(o.score, this.score);
            }
        }

        List<ScoredCandidate> scoredList = new ArrayList<>();

        for (User target : candidates) {
            int score = 0;
            String primaryReason = null;

            boolean sameBatch = requester.getBatch() != null && requester.getBatch().equalsIgnoreCase(target.getBatch());
            boolean sameDept = requester.getDepartment() != null && requester.getDepartment().equalsIgnoreCase(target.getDepartment());
            boolean sameSection = requester.getSection() != null && requester.getSection().equalsIgnoreCase(target.getSection());

            if (sameBatch && sameDept) {
                score += 5;
                if (sameSection) {
                    score += 3;
                    primaryReason = "Same class — " + target.getBatch() + " " + target.getDepartment() + "-" + target.getSection();
                } else {
                    primaryReason = "Same batch & branch — " + target.getBatch() + " " + target.getDepartment();
                }
            } else if (sameBatch) {
                score += 2;
                primaryReason = "Class of " + target.getBatch();
            } else if (sameDept) {
                score += 2;
                primaryReason = "Same branch: " + target.getDepartment();
            }

            // Mutual In-Touch connections (highest individual weight)
            Set<UUID> targetConns = userConnectionMap.getOrDefault(target.getId(), Collections.emptySet());
            long mutualCount = targetConns.stream().filter(requesterConnectionIds::contains).count();
            if (mutualCount > 0) {
                score += (int) (mutualCount * 3);
                if (primaryReason == null) primaryReason = mutualCount + " mutual connection" + (mutualCount == 1 ? "" : "s");
            }

            // Same city
            if (requester.getCurrentCity() != null && target.getCurrentCity() != null
                    && requester.getCurrentCity().equalsIgnoreCase(target.getCurrentCity())) {
                score += 2;
                if (primaryReason == null) primaryReason = "Lives in " + target.getCurrentCity();
            }

            // Same company
            if (requester.getCurrentCompany() != null && target.getCurrentCompany() != null
                    && requester.getCurrentCompany().equalsIgnoreCase(target.getCurrentCompany())) {
                score += 2;
                if (primaryReason == null) primaryReason = "Works at " + target.getCurrentCompany();
            }

            // Shared skills
            if (!requesterSkillSet.isEmpty() && target.getSkills() != null) {
                for (String s : target.getSkills().split(",")) {
                    if (requesterSkillSet.contains(s.trim().toLowerCase())) {
                        score += 1;
                        if (primaryReason == null) primaryReason = "Similar skills";
                    }
                }
            }

            // Only include users with a positive score (no random recommendations)
            if (score > 0) {
                scoredList.add(new ScoredCandidate(target, score, primaryReason != null ? primaryReason : "Recommended Classmate"));
            }
        }

        Collections.sort(scoredList);

        return scoredList.stream()
                .limit(12)
                .map(sc -> {
                    UserDto dto = convertToDtoWithContext(requester, sc.user);
                    dto.setRecommendationReason(sc.reason);
                    return dto;
                })
                .collect(Collectors.toList());
    }
}
