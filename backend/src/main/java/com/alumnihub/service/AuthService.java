package com.alumnihub.service;

import com.alumnihub.dto.AuthRequest;
import com.alumnihub.dto.AuthResponse;
import com.alumnihub.entity.User;
import com.alumnihub.repository.UserRepository;
import com.alumnihub.security.JwtUtil;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse authenticateWithGoogle(AuthRequest authRequest) throws Exception {
        String firebaseTokenStr = authRequest.getFirebaseToken();
        
        // 1. Verify the Firebase token using Firebase Admin SDK
        FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(firebaseTokenStr);
        
        String uid = decodedToken.getUid();
        String email = decodedToken.getEmail();
        String name = decodedToken.getName();
        String picture = decodedToken.getPicture();

        if (email == null) {
            throw new IllegalArgumentException("Firebase token does not contain an email address");
        }

        // 2. Check if user already exists
        Optional<User> userOpt = userRepository.findByFirebaseUid(uid);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(email);
        }

        User user;
        boolean isNewUser = false;

        if (userOpt.isPresent()) {
            user = userOpt.get();
            // Update profile fields dynamically if updated in Google account
            boolean updated = false;
            if (user.getFirebaseUid() == null || !user.getFirebaseUid().equals(uid)) {
                user.setFirebaseUid(uid);
                updated = true;
            }
            if (name != null && !name.equals(user.getFullName())) {
                user.setFullName(name);
                updated = true;
            }
            if (picture != null && (user.getProfilePictureUrl() == null || user.getProfilePictureUrl().contains("googleusercontent.com")) && !picture.equals(user.getProfilePictureUrl())) {
                user.setProfilePictureUrl(picture);
                updated = true;
            }
            if (updated) {
                user = userRepository.save(user);
            }
        } else {
            // Register a new user
            user = User.builder()
                    .firebaseUid(uid)
                    .email(email)
                    .fullName(name != null ? name : "Alumni Member")
                    .profilePictureUrl(picture)
                    .role("USER")
                    .build();
            user = userRepository.save(user);
            isNewUser = true;
        }

        // 3. Generate our application JWT
        String jwtToken = jwtUtil.generateToken(user);

        // 4. Onboarding status (pending if profileCompleted is false, or batch/department are missing)
        String authStatus = "ONBOARDED";
        if (isNewUser || !Boolean.TRUE.equals(user.getProfileCompleted()) || user.getBatch() == null || user.getDepartment() == null) {
            authStatus = "PENDING_ONBOARDING";
        }

        return AuthResponse.builder()
                .token(jwtToken)
                .user(user)
                .authStatus(authStatus)
                .build();
    }
}
