package com.alumnihub.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class ReferralRequestDto {
    private UUID id;
    private UUID referralId;
    private String referralCompany;
    private String referralRole;
    private UUID requesterId;
    private String requesterName;
    private String resumeUrl;
    private String status;
}
