package com.cricket.service;

import com.cricket.dto.MatchDto;
import com.cricket.entity.*;
import com.cricket.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final TeamRepository teamRepository;
    private final ScoreRepository scoreRepository;
    private final BallRepository ballRepository;

    public MatchDto.MatchResponse createMatch(MatchDto.CreateMatchRequest request) {
        Team teamA = teamRepository.findById(request.getTeamAId())
                .orElseThrow(() -> new RuntimeException("Team A not found"));
        Team teamB = teamRepository.findById(request.getTeamBId())
                .orElseThrow(() -> new RuntimeException("Team B not found"));

        Match match = new Match();
        match.setTeamA(teamA);
        match.setTeamB(teamB);
        match.setTotalOvers(request.getTotalOvers());
        matchRepository.save(match);

        // Initialize score
        Score score = new Score();
        score.setMatch(match);
        scoreRepository.save(score);

        return toMatchResponse(match);
    }

    public MatchDto.MatchResponse getMatch(Long id) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match not found"));
        return toMatchResponse(match);
    }

    public List<MatchDto.MatchResponse> getAllMatches() {
        return matchRepository.findAll().stream()
                .map(this::toMatchResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MatchDto.ScoreResponse undoLastBall(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        if ("COMPLETED".equals(match.getStatus())) {
            throw new RuntimeException("Cannot undo a completed match");
        }

        Score score = scoreRepository.findByMatchId(matchId)
                .orElseThrow(() -> new RuntimeException("Score not found"));

        // Find the last ball recorded
        List<Ball> balls = ballRepository.findByMatchIdOrderByOverNumberAscBallNumberAsc(matchId);
        if (balls.isEmpty()) throw new RuntimeException("No balls to undo");

        Ball last = balls.get(balls.size() - 1);

        // Reverse the score
        score.setRuns(Math.max(0, score.getRuns() - last.getRuns()));
        if (last.getIsWicket()) {
            score.setWickets(Math.max(0, score.getWickets() - 1));
        }
        // Only decrement legal balls count for non-extras
        boolean wasExtra = last.getExtraType() != null && !last.getExtraType().isBlank();
        if (!wasExtra) {
            score.setBallsBowled(Math.max(0, score.getBallsBowled() - 1));
        }

        ballRepository.delete(last);
        scoreRepository.save(score);

        return buildScoreResponse(match, score);
    }

    @Transactional
    public MatchDto.ScoreResponse recordBall(MatchDto.BallRequest request) {
        Match match = matchRepository.findById(request.getMatchId())
                .orElseThrow(() -> new RuntimeException("Match not found"));

        Score score = scoreRepository.findByMatchId(request.getMatchId())
                .orElseThrow(() -> new RuntimeException("Score not found"));

        boolean isExtra = request.getExtraType() != null && !request.getExtraType().isBlank();

        // Calculate over/ball position for this ball
        int totalLegalBalls = score.getBallsBowled();
        int overNumber = totalLegalBalls / 6;
        int ballInOver = totalLegalBalls % 6;

        // Save ball
        Ball ball = new Ball();
        ball.setMatch(match);
        ball.setOverNumber(overNumber);
        ball.setBallNumber(ballInOver + 1);
        ball.setRuns(request.getRuns() != null ? request.getRuns() : 0);
        ball.setExtraType(isExtra ? request.getExtraType().toUpperCase() : null);
        ball.setIsWicket(request.getIsWicket() != null && request.getIsWicket());
        ball.setBatsmanId(request.getBatsmanId());
        ball.setBowlerId(request.getBowlerId());
        ballRepository.save(ball);

        // Update score
        score.setRuns(score.getRuns() + ball.getRuns());
        if (ball.getIsWicket()) {
            score.setWickets(score.getWickets() + 1);
        }
        // Only count legal balls (not wides or no-balls)
        if (!isExtra) {
            score.setBallsBowled(score.getBallsBowled() + 1);
        }
        if (request.getCurrentBatsman() != null && !request.getCurrentBatsman().isBlank()) {
            score.setCurrentBatsman(request.getCurrentBatsman());
        }
        if (request.getCurrentBowler() != null && !request.getCurrentBowler().isBlank()) {
            score.setCurrentBowler(request.getCurrentBowler());
        }

        // Check if match is over
        int newLegalBalls = score.getBallsBowled();
        int maxBalls = match.getTotalOvers() * 6;
        if (newLegalBalls >= maxBalls || score.getWickets() >= 10) {
            match.setStatus("COMPLETED");
            matchRepository.save(match);
        }

        scoreRepository.save(score);

        return buildScoreResponse(match, score);
    }

    public MatchDto.ScoreResponse getScore(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
        Score score = scoreRepository.findByMatchId(matchId)
                .orElseThrow(() -> new RuntimeException("Score not found"));
        return buildScoreResponse(match, score);
    }

    private MatchDto.ScoreResponse buildScoreResponse(Match match, Score score) {
        MatchDto.ScoreResponse response = new MatchDto.ScoreResponse();
        response.setMatchId(match.getId());
        response.setTeamAName(match.getTeamA().getName());
        response.setTeamBName(match.getTeamB().getName());
        response.setTotalOvers(match.getTotalOvers());
        response.setRuns(score.getRuns());
        response.setWickets(score.getWickets());
        response.setStatus(match.getStatus());
        response.setCurrentBatsman(score.getCurrentBatsman());
        response.setCurrentBowler(score.getCurrentBowler());

        int legalBalls = score.getBallsBowled();
        int completedOvers = legalBalls / 6;
        int ballsInCurrentOver = legalBalls % 6;
        response.setOvers(completedOvers + "." + ballsInCurrentOver);

        List<Ball> lastSix = ballRepository.findTop6ByMatchIdOrderByIdDesc(match.getId());
        response.setLastSixBalls(lastSix.stream().map(b -> {
            MatchDto.BallResponse br = new MatchDto.BallResponse();
            br.setId(b.getId());
            br.setOverNumber(b.getOverNumber());
            br.setBallNumber(b.getBallNumber());
            br.setRuns(b.getRuns());
            br.setExtraType(b.getExtraType());
            br.setIsWicket(b.getIsWicket());
            return br;
        }).collect(Collectors.toList()));

        return response;
    }

    private MatchDto.MatchResponse toMatchResponse(Match match) {
        MatchDto.MatchResponse response = new MatchDto.MatchResponse();
        response.setId(match.getId());
        response.setTeamAName(match.getTeamA().getName());
        response.setTeamBName(match.getTeamB().getName());
        response.setTotalOvers(match.getTotalOvers());
        response.setStatus(match.getStatus());
        return response;
    }
}
