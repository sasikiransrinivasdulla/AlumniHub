package com.alumnihub.controller;

import com.alumnihub.dto.UserDto;
import com.alumnihub.dto.UserProfileUpdateDto;
import com.alumnihub.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMyProfile(Principal principal) {
        UserDto profile = userService.getProfile(principal.getName());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateMyProfile(
            Principal principal,
            @Valid @RequestBody UserProfileUpdateDto updateDto) {
        UserDto updatedProfile = userService.updateProfile(principal.getName(), updateDto);
        return ResponseEntity.ok(updatedProfile);
    }
}
