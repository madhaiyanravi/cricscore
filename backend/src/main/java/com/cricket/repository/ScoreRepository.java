package com.cricket.repository;

import com.cricket.entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ScoreRepository extends JpaRepository<Score, Long> {
    Optional<Score> findByMatchId(Long matchId);
}
