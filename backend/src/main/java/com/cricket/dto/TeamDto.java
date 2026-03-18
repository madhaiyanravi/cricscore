package com.cricket.dto;

import lombok.Data;
import java.util.List;

public class TeamDto {

    @Data
    public static class CreateTeamRequest {
        private String name;
    }

    @Data
    public static class AddPlayerRequest {
        private String name;
        private Long   teamId;
        private String battingStyle;
        private String bowlingStyle;
        private String role;
        private String avatarUrl;
        private Integer jerseyNumber;
        private String bio;
    }

    @Data
    public static class UpdatePlayerRequest {
        private String  name;
        private String  battingStyle;
        private String  bowlingStyle;
        private String  role;
        private String  avatarUrl;
        private Integer jerseyNumber;
        private String  bio;
    }

    @Data
    public static class PlayerResponse {
        private Long    id;
        private String  name;
        private String  avatarUrl;
        private String  battingStyle;
        private String  bowlingStyle;
        private String  role;
        private Integer jerseyNumber;
        private String  bio;
        private Integer totalMatches;
        private Integer totalRuns;
        private Integer totalWickets;
        private Integer highestScore;
        private Integer totalFours;
        private Integer totalSixes;
        private Integer totalBallsFaced;
        private Double  battingAverage;
        private Double  strikeRate;
        private Double  bowlingAverage;
        private Double  economyRate;
    }

    @Data
    public static class TeamResponse {
        private Long   id;
        private String name;
        private List<PlayerResponse> players;
    }
}
