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
}
