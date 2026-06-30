package com.alumnihub.dto;

import com.alumnihub.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private User user;
    private String authStatus; // "ONBOARDED" or "PENDING_ONBOARDING"
}
