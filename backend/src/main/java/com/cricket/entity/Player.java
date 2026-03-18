package com.cricket.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "players")
@Data
@NoArgsConstructor
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    // ── Profile ──────────────────────────────────────────────────────────────
    private String avatarUrl;
    private String battingStyle;  // RIGHT_HAND, LEFT_HAND
    private String bowlingStyle;  // FAST, MEDIUM, SPIN, null
    private String role;          // BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER
    private Integer jerseyNumber;
    private String bio;

    // ── Career stats (cached, updated after every ball recorded) ─────────────
    private Integer totalMatches     = 0;
    private Integer totalRuns        = 0;
    private Integer totalWickets     = 0;
    private Integer highestScore     = 0;
    private Integer totalFours       = 0;
    private Integer totalSixes       = 0;
    private Integer totalBallsFaced  = 0;
    private Integer totalBallsBowled = 0;
    private Integer totalRunsConceded = 0;
    private Integer totalDismissals  = 0;  // times out

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;
}
