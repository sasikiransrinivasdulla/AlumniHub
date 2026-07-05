package com.alumnihub.controller;

import com.alumnihub.dto.ReferralCreateDto;
import com.alumnihub.dto.ReferralDto;
import com.alumnihub.dto.ReferralRequestDto;
import com.alumnihub.service.ReferralService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/referrals")
@RequiredArgsConstructor
public class ReferralController {

    private final ReferralService referralService;

    @PostMapping
    public ResponseEntity<ReferralDto> createReferral(Principal principal, @RequestBody ReferralCreateDto createDto) {
        return ResponseEntity.ok(referralService.createReferral(principal.getName(), createDto));
    }

    @GetMapping
    public ResponseEntity<List<ReferralDto>> getReferrals() {
        return ResponseEntity.ok(referralService.getReferrals());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReferral(Principal principal, @PathVariable UUID id) {
        referralService.deleteReferral(principal.getName(), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/apply")
    public ResponseEntity<ReferralRequestDto> requestReferral(
            Principal principal,
            @PathVariable UUID id,
            @RequestParam String resumeUrl
    ) {
        return ResponseEntity.ok(referralService.requestReferral(principal.getName(), id, resumeUrl));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<ReferralRequestDto>> getReferralRequests(Principal principal) {
        return ResponseEntity.ok(referralService.getReferralRequests(principal.getName()));
    }

    @PostMapping("/requests/{id}/fulfill")
    public ResponseEntity<ReferralRequestDto> fulfillReferral(Principal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(referralService.fulfillReferralRequest(principal.getName(), id));
    }

    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<ReferralRequestDto> rejectReferral(Principal principal, @PathVariable UUID id) {
        return ResponseEntity.ok(referralService.rejectReferralRequest(principal.getName(), id));
    }
}
