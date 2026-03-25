package com.cricket.controller;

import com.cricket.dto.MatchDto;
import com.cricket.security.JwtUtil;
import com.cricket.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicController {

    private final MatchService matchService;
    private final JwtUtil jwtUtil;

    @GetMapping("/score/{matchId}")
    public ResponseEntity<MatchDto.ScoreResponse> getPublicScore(
            @PathVariable Long matchId,
            @RequestParam(name = "t") String token) {
        if (token == null || token.isBlank() || !jwtUtil.validateSpectatorToken(token, matchId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(matchService.getScore(matchId));
    }

    @GetMapping("/score/{matchId}/balls")
    public ResponseEntity<List<MatchDto.BallDetailResponse>> getPublicBallByBall(
            @PathVariable Long matchId,
            @RequestParam(name = "t") String token,
            @RequestParam(name = "inningsNumber", required = false) Integer inningsNumber
    ) {
        if (token == null || token.isBlank() || !jwtUtil.validateSpectatorToken(token, matchId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(matchService.getBallByBall(matchId, inningsNumber));
    }

    @GetMapping("/match/{matchId}/summary")
    public ResponseEntity<MatchDto.MatchSummaryResponse> getPublicMatchSummary(
            @PathVariable Long matchId,
            @RequestParam(name = "t") String token
    ) {
        if (token == null || token.isBlank() || !jwtUtil.validateSpectatorToken(token, matchId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(matchService.getMatchSummary(matchId));
    }
}
