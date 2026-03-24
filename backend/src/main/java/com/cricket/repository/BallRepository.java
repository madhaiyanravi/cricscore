package com.cricket.repository;

import com.cricket.entity.Ball;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BallRepository extends JpaRepository<Ball, Long> {
    List<Ball> findByMatchIdOrderByOverNumberAscBallNumberAsc(Long matchId);
    List<Ball> findByMatchIdAndInningsNumberOrderByOverNumberAscBallNumberAsc(Long matchId, Integer inningsNumber);
    // Get last 6 balls
    List<Ball> findTop6ByMatchIdAndInningsNumberOrderByIdDesc(Long matchId, Integer inningsNumber);
}
