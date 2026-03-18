package com.cricket.controller;

import com.cricket.dto.AnalyticsDto;
import com.cricket.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/match/{matchId}")
    public ResponseEntity<AnalyticsDto.MatchAnalyticsResponse> getMatchAnalytics(
            @PathVariable Long matchId) {
        return ResponseEntity.ok(analyticsService.getMatchAnalytics(matchId));
    }
}
