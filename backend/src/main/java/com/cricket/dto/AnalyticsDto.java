package com.cricket.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

public class AnalyticsDto {

    @Data
    public static class OverData {
        private Integer over;
        private Integer runs;
        private Integer wickets;
        private Double  runRate;
    }

    @Data
    public static class MatchAnalyticsResponse {
        private Long    matchId;
        private String  teamAName;
        private String  teamBName;
        private Integer totalRuns;
        private Integer totalWickets;
        private Integer totalFours;
        private Integer totalSixes;
        private Integer totalExtras;
        private Integer dotBalls;
        private String  topScorerName;
        private Integer topScorerRuns;
        private String  topBowlerName;
        private Integer topBowlerWickets;
        private List<OverData> overByOver;
        // Boundary breakdown: { "FOUR": 5, "SIX": 3, "DOT": 12, "SINGLE": 8, ... }
        private Map<String, Integer> runsBreakdown;
    }
}
