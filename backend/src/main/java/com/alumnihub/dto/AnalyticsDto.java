package com.alumnihub.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class AnalyticsDto {
    private long connectionsCount;
    private long memoriesCount;
    private long profileViewsCount;
    private long searchAppearancesCount;
    private long likesReceivedCount;
    private long commentsReceivedCount;
    private String mostActiveMonth;
    private Map<String, Long> connectionGrowth;
    private Map<String, Long> profileViewsTrend;
}
