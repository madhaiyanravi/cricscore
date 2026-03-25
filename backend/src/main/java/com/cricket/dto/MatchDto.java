package com.cricket.dto;

import lombok.Data;
import java.util.Map;
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
        private Long manOfTheMatchPlayerId;
        private String manOfTheMatchPlayerName;
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
    public static class BallDetailResponse {
        private Long id;
        private Integer inningsNumber;
        private Integer overNumber;
        private Integer ballNumber;
        private Integer runs; // total
        private Integer batRuns;
        private Integer extraRuns;
        private String extraType;
        private Boolean isWicket;
        private Long batsmanId;
        private String batsmanName;
        private Long bowlerId;
        private String bowlerName;
        private String wicketType;
        private Long wicketBatsmanId;
        private String wicketBatsmanName;
        private Long fielderId;
        private String fielderName;
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
        private Integer extrasTotal;
        private Map<String, Integer> extrasBreakdown;
        private List<BallResponse> lastSixBalls;
        private List<BatterLine> battingCard;
        private List<BowlerLine> bowlingCard;
        private Boolean overEnded;
    }

    @Data
    public static class SpectateTokenResponse {
        private String token;
    }

    @Data
    public static class SetManOfTheMatchRequest {
        private Long playerId;
    }

    @Data
    public static class MomCandidateResponse {
        private Long playerId;
        private String name;
        private Double points;
        private Integer runs;
        private Integer wickets;
    }

    @Data
    public static class WicketFallResponse {
        private Integer wicketNumber;
        private Integer score;
        private String overs;
        private Long batsmanId;
        private String batsmanName;
        private String wicketType;
    }

    @Data
    public static class InningsSummaryResponse {
        private Integer inningsNumber;
        private Long battingTeamId;
        private String battingTeamName;
        private Long bowlingTeamId;
        private String bowlingTeamName;
        private Integer runs;
        private Integer wickets;
        private String overs;
        private Integer extrasTotal;
        private Map<String, Integer> extrasBreakdown;
        private Integer targetRuns;
        private List<BatterLine> battingCard;
        private List<BowlerLine> bowlingCard;
        private List<WicketFallResponse> fallOfWickets;
    }

    @Data
    public static class MatchSummaryResponse {
        private MatchResponse match;
        private List<InningsSummaryResponse> innings;
        private List<MomCandidateResponse> momCandidates; // top suggestions
    }
}
