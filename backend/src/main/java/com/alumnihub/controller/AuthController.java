package com.alumnihub.controller;

import com.alumnihub.dto.AuthRequest;
import com.alumnihub.dto.AuthResponse;
import com.alumnihub.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google")
    public ResponseEntity<?> authenticateWithGoogle(@RequestBody AuthRequest authRequest) {
        try {
            AuthResponse response = authService.authenticateWithGoogle(authRequest);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Authentication bad request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Authentication error: ", e);
            return ResponseEntity.status(500).body("Authentication failed: " + e.getMessage());
        }
    }
}
