package com.cricket.dto;

import lombok.Data;
import java.util.List;

public class MatchDto {

    @Data
    public static class CreateMatchRequest {
        private Long teamAId;
        private Long teamBId;
        private Integer totalOvers;
    }

    @Data
    public static class MatchResponse {
        private Long id;
        private String teamAName;
        private String teamBName;
        private Integer totalOvers;
        private String status;
    }

    @Data
    public static class BallRequest {
        private Long matchId;
        private Integer runs;
        private String extraType; // WIDE, NO_BALL, or null
        private Boolean isWicket;
        private String currentBatsman;
        private String currentBowler;
        private Long batsmanId;
        private Long bowlerId;
    }

    @Data
    public static class BallResponse {
        private Long id;
        private Integer overNumber;
        private Integer ballNumber;
        private Integer runs;
        private String extraType;
        private Boolean isWicket;
    }

    @Data
    public static class ScoreResponse {
        private Long matchId;
        private String teamAName;
        private String teamBName;
        private Integer totalOvers;
        private Integer runs;
        private Integer wickets;
        private String overs; // e.g. "3.2"
        private String currentBatsman;
        private String currentBowler;
        private String status;
        private List<BallResponse> lastSixBalls;
    }
}
