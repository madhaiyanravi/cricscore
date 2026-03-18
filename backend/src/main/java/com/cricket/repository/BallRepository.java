package com.cricket.repository;

import com.cricket.entity.Ball;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BallRepository extends JpaRepository<Ball, Long> {
    List<Ball> findByMatchIdOrderByOverNumberAscBallNumberAsc(Long matchId);
    // Get last 6 balls
    List<Ball> findTop6ByMatchIdOrderByIdDesc(Long matchId);
}
