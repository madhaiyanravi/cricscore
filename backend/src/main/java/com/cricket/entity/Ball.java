package com.cricket.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "balls")
@Data
@NoArgsConstructor
public class Ball {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Column(nullable = false)
    private Integer overNumber;

    @Column(nullable = false)
    private Integer ballNumber;

    @Column(nullable = false)
    private Integer runs = 0;

    private String  extraType;    // WIDE, NO_BALL, null
    private Boolean isWicket = false;

    // For player profile stats & analytics
    private Long batsmanId;
    private Long bowlerId;
}
