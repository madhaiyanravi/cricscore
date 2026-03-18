package com.cricket.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity @Table(name = "scores") @Data @NoArgsConstructor
public class Score {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    private Integer runs         = 0;
    private Integer wickets      = 0;
    private Integer ballsBowled  = 0;  // legal deliveries only
    private String  currentBatsman;
    private String  currentBowler;
}
