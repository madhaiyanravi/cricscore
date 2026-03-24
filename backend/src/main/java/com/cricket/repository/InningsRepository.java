package com.cricket.repository;

import com.cricket.entity.Innings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InningsRepository extends JpaRepository<Innings, Long> {
    Optional<Innings> findByMatchIdAndStatus(Long matchId, String status);
    List<Innings> findByMatchIdOrderByInningsNumberAsc(Long matchId);
}

