package com.cricket.dto;

import lombok.Data;
import java.util.List;

public class MatchDto {

    @Data
    public static class CreateMatchRequest {
        private Long teamAId;
        private Long teamBId;
        private Integer totalOvers;
        private Long tossWinnerTeamId;
        private String tossDecision; // BAT, BOWL
    }

    @Data
    public static class MatchResponse {
        private Long id;
        private Long teamAId;
        private Long teamBId;
        private String teamAName;
        private String teamBName;
        private Integer totalOvers;
        private String status;
        private Long tossWinnerTeamId;
        private String tossDecision;
        private Long winnerTeamId;
        private String resultText;
    }

    @Data
    public static class BallRequest {
        private Long matchId;
        private Integer runs;     // legacy: treated as batRuns when batRuns is null
        private Integer batRuns;
        private Integer extraRuns; // for extras; meaning depends on extraType (see service)
        private String extraType; // WIDE, NO_BALL, BYE, LEG_BYE, PENALTY, or null
        private Boolean isWicket;
        private String currentBatsman; // legacy
        private String currentBowler;  // legacy
        private Long batsmanId;     // striker
        private Long nonStrikerId;
        private Long bowlerId;

        // Wicket details
        private String wicketType;
        private Long wicketBatsmanId;
        private Long fielderId;
        private Long newBatsmanId;
    }

    @Data
    public static class BallResponse {
        private Long id;
        private Integer overNumber;
        private Integer ballNumber;
        private Integer runs; // total
        private Integer batRuns;
        private Integer extraRuns;
        private String extraType;
        private Boolean isWicket;
        private String wicketType;
        private Long wicketBatsmanId;
        private Long fielderId;
    }

    @Data
    public static class BatterLine {
        private Long playerId;
        private String name;
        private Integer runs;
        private Integer balls;
        private Integer fours;
        private Integer sixes;
        private Boolean out;
        private String dismissal;
    }

    @Data
    public static class BowlerLine {
        private Long playerId;
        private String name;
        private String overs; // e.g "2.3"
        private Integer maidens;
        private Integer runs;
        private Integer wickets;
        private Double economy;
    }

    @Data
    public static class ScoreResponse {
        private Long matchId;
        private String teamAName;
        private String teamBName;
        private Integer totalOvers;
        private Integer inningsNumber;
        private Long battingTeamId;
        private String battingTeamName;
        private Long bowlingTeamId;
        private String bowlingTeamName;
        private Integer runs;
        private Integer wickets;
        private String overs; // e.g. "3.2"
        private Long strikerId;
        private String strikerName;
        private Long nonStrikerId;
        private String nonStrikerName;
        private Long currentBowlerId;
        private String currentBowlerName;
        private Integer targetRuns;
        private Integer requiredRuns;
        private Integer remainingBalls;
        private String resultText;
        private String status;
        private List<BallResponse> lastSixBalls;
        private List<BatterLine> battingCard;
        private List<BowlerLine> bowlingCard;
        private Boolean overEnded;
    }

    @Data
    public static class SpectateTokenResponse {
        private String token;
    }
}
