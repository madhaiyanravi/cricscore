package com.cricket.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "match_analytics")
@Data
@NoArgsConstructor
public class MatchAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    private String  topScorerName;
    private Integer topScorerRuns;
    private String  topBowlerName;
    private Integer topBowlerWickets;

    private Integer totalFours    = 0;
    private Integer totalSixes    = 0;
    private Integer totalExtras   = 0;
    private Integer dotBalls      = 0;
    private Integer totalWickets  = 0;

    // CSV: "over:runs,over:runs"  e.g. "1:6,2:8,3:4"
    @Column(length = 500)
    private String overByOverRuns;
}
