package com.cricket.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "matches")
@Data
@NoArgsConstructor
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_a_id", nullable = false)
    private Team teamA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_b_id", nullable = false)
    private Team teamB;

    @Column(nullable = false)
    private Integer totalOvers;

    @Column(nullable = false)
    private String status = "IN_PROGRESS"; // IN_PROGRESS, COMPLETED

    // Toss (optional but required for 2-innings flow)
    private Long tossWinnerTeamId; // teamA/teamB id
    private String tossDecision;   // BAT, BOWL

    // Result
    private Long winnerTeamId;
    @Column(length = 200)
    private String resultText;

    // Awards
    private Long manOfTheMatchPlayerId;
}
