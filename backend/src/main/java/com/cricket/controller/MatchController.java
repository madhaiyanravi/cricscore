package com.cricket.controller;

import com.cricket.dto.MatchDto;
import com.cricket.security.JwtUtil;
import com.cricket.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;
    private final JwtUtil jwtUtil;

    @PostMapping("/matches")
    public ResponseEntity<MatchDto.MatchResponse> createMatch(@RequestBody MatchDto.CreateMatchRequest request) {
        return ResponseEntity.ok(matchService.createMatch(request));
    }

    @GetMapping("/matches")
    public ResponseEntity<List<MatchDto.MatchResponse>> getAllMatches() {
        return ResponseEntity.ok(matchService.getAllMatches());
    }

    @GetMapping("/matches/{id}")
    public ResponseEntity<MatchDto.MatchResponse> getMatch(@PathVariable Long id) {
        return ResponseEntity.ok(matchService.getMatch(id));
    }

    @PostMapping("/matches/{id}/innings/2/start")
    public ResponseEntity<MatchDto.ScoreResponse> startSecondInnings(@PathVariable Long id) {
        return ResponseEntity.ok(matchService.startSecondInnings(id));
    }

    @PostMapping("/matches/{id}/spectate-token")
    public ResponseEntity<MatchDto.SpectateTokenResponse> createSpectateToken(@PathVariable Long id) {
        MatchDto.SpectateTokenResponse resp = new MatchDto.SpectateTokenResponse();
        resp.setToken(jwtUtil.generateSpectatorToken(id));
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/score/ball/last/{matchId}")
    public ResponseEntity<MatchDto.ScoreResponse> undoLastBall(@PathVariable Long matchId) {
        return ResponseEntity.ok(matchService.undoLastBall(matchId));
    }

    @PostMapping("/score/ball")
    public ResponseEntity<MatchDto.ScoreResponse> recordBall(@RequestBody MatchDto.BallRequest request) {
        return ResponseEntity.ok(matchService.recordBall(request));
    }

    @GetMapping("/score/{matchId}")
    public ResponseEntity<MatchDto.ScoreResponse> getScore(@PathVariable Long matchId) {
        return ResponseEntity.ok(matchService.getScore(matchId));
    }

    @GetMapping("/score/{matchId}/balls")
    public ResponseEntity<List<MatchDto.BallDetailResponse>> getBallByBall(
            @PathVariable Long matchId,
            @RequestParam(name = "inningsNumber", required = false) Integer inningsNumber
    ) {
        return ResponseEntity.ok(matchService.getBallByBall(matchId, inningsNumber));
    }
}
