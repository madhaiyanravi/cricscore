package com.cricket.repository;

import com.cricket.entity.MatchAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MatchAnalyticsRepository extends JpaRepository<MatchAnalytics, Long> {
    Optional<MatchAnalytics> findByMatchId(Long matchId);
}
