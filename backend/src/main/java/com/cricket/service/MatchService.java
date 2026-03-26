package com.cricket.service;

import com.cricket.dto.MatchDto;
import com.cricket.entity.*;
import com.cricket.rules.InningsRules;
import com.cricket.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final TeamRepository teamRepository;
    private final BallRepository ballRepository;
    private final InningsRepository inningsRepository;
    private final PlayerRepository playerRepository;

    public MatchDto.MatchResponse createMatch(MatchDto.CreateMatchRequest request) {
        if (request.getTotalOvers() == null) throw new RuntimeException("totalOvers is required");
        if (request.getTotalOvers() < 1 || request.getTotalOvers() > 50) {
            throw new RuntimeException("totalOvers must be between 1 and 50");
        }

        Team teamA = teamRepository.findById(request.getTeamAId())
                .orElseThrow(() -> new RuntimeException("Team A not found"));
        Team teamB = teamRepository.findById(request.getTeamBId())
                .orElseThrow(() -> new RuntimeException("Team B not found"));

        Match match = new Match();
        match.setTeamA(teamA);
        match.setTeamB(teamB);
        match.setTotalOvers(request.getTotalOvers());
        match.setTossWinnerTeamId(request.getTossWinnerTeamId());
        match.setTossDecision(request.getTossDecision() != null ? request.getTossDecision().toUpperCase(Locale.ROOT) : null);
        matchRepository.save(match);

        // Initialize innings 1
        Team batting = teamA;
        Team bowling = teamB;
        if (request.getTossWinnerTeamId() != null && request.getTossDecision() != null) {
            Long tossWinnerId = request.getTossWinnerTeamId();
            Team tossWinner = tossWinnerId.equals(teamA.getId()) ? teamA : teamB;
            Team other = tossWinnerId.equals(teamA.getId()) ? teamB : teamA;
            String decision = request.getTossDecision().toUpperCase(Locale.ROOT);
            if ("BAT".equals(decision)) {
                batting = tossWinner;
                bowling = other;
            } else if ("BOWL".equals(decision)) {
                batting = other;
                bowling = tossWinner;
            }
        }

        Innings inn1 = new Innings();
        inn1.setMatch(match);
        inn1.setInningsNumber(1);
        inn1.setBattingTeam(batting);
        inn1.setBowlingTeam(bowling);
        inningsRepository.save(inn1);

        return toMatchResponse(match);
    }

    public MatchDto.MatchResponse getMatch(Long id) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match not found"));
        return toMatchResponse(match);
    }

    @Transactional(readOnly = true)
    public MatchDto.MatchSummaryResponse getMatchSummary(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        List<Innings> inningsList = inningsRepository.findByMatchIdOrderByInningsNumberAsc(matchId);
        List<MatchDto.InningsSummaryResponse> innResp = new ArrayList<>();
        for (Innings inn : inningsList) {
            List<Ball> balls = ballRepository.findByMatchIdAndInningsNumberOrderByIdAsc(matchId, inn.getInningsNumber());
            ExtrasSummary extras = computeExtras(balls);

            MatchDto.InningsSummaryResponse r = new MatchDto.InningsSummaryResponse();
            r.setInningsNumber(inn.getInningsNumber());
            r.setBattingTeamId(inn.getBattingTeam().getId());
            r.setBattingTeamName(inn.getBattingTeam().getName());
            r.setBowlingTeamId(inn.getBowlingTeam().getId());
            r.setBowlingTeamName(inn.getBowlingTeam().getName());
            r.setRuns(inn.getRuns());
            r.setWickets(inn.getWickets());
            r.setOvers(formatOvers(inn.getBallsBowled()));
            r.setExtrasTotal(extras.total);
            r.setExtrasBreakdown(extras.breakdown);
            r.setTargetRuns(inn.getTargetRuns());
            r.setBattingCard(buildBattingCard(balls));
            r.setBowlingCard(buildBowlingCard(balls));
            r.setFallOfWickets(buildFallOfWickets(balls));
            innResp.add(r);
        }

        MatchDto.MatchSummaryResponse summary = new MatchDto.MatchSummaryResponse();
        summary.setMatch(toMatchResponse(match));
        summary.setInnings(innResp);
        summary.setMomCandidates(suggestManOfTheMatch(matchId, 5));
        return summary;
    }

    @Transactional
    public MatchDto.MatchResponse setManOfTheMatch(Long matchId, Long playerId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
        if (playerId == null) throw new RuntimeException("playerId is required");
        // validate player exists
        playerRepository.findById(playerId).orElseThrow(() -> new RuntimeException("Player not found"));
        match.setManOfTheMatchPlayerId(playerId);
        matchRepository.save(match);
        return toMatchResponse(match);
    }

    @Transactional
    public MatchDto.MatchResponse autoSetManOfTheMatch(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
        List<MatchDto.MomCandidateResponse> candidates = suggestManOfTheMatch(matchId, 1);
        if (candidates.isEmpty()) throw new RuntimeException("No MOM candidates found");
        match.setManOfTheMatchPlayerId(candidates.get(0).getPlayerId());
        matchRepository.save(match);
        return toMatchResponse(match);
    }

    public List<MatchDto.MatchResponse> getAllMatches() {
        return matchRepository.findAll().stream()
                .map(this::toMatchResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MatchDto.ScoreResponse startSecondInnings(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        List<Innings> inningsList = inningsRepository.findByMatchIdOrderByInningsNumberAsc(matchId);
        if (inningsList.isEmpty()) throw new RuntimeException("Innings not found");

        Innings inn1 = inningsList.get(0);
        if (!"COMPLETED".equals(inn1.getStatus())) throw new RuntimeException("First innings not completed");
        if (inningsList.size() >= 2) {
            Innings inn2 = inningsList.get(1);
            if ("IN_PROGRESS".equals(inn2.getStatus())) return buildScoreResponse(match, inn2, false);
            throw new RuntimeException("Second innings already completed");
        }

        Team batting = inn1.getBowlingTeam();
        Team bowling = inn1.getBattingTeam();

        Innings inn2 = new Innings();
        inn2.setMatch(match);
        inn2.setInningsNumber(2);
        inn2.setBattingTeam(batting);
        inn2.setBowlingTeam(bowling);
        inn2.setTargetRuns(inn1.getRuns() + 1);
        inningsRepository.save(inn2);
        return buildScoreResponse(match, inn2, false);
    }

    @Transactional
    public MatchDto.ScoreResponse undoLastBall(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        if ("COMPLETED".equals(match.getStatus())) {
            throw new RuntimeException("Cannot undo a completed match");
        }

        Innings innings = inningsRepository.findByMatchIdAndStatus(matchId, "IN_PROGRESS")
                .orElseThrow(() -> new RuntimeException("No active innings"));

        List<Ball> balls = ballRepository.findByMatchIdAndInningsNumberOrderByOverNumberAscBallNumberAsc(matchId, innings.getInningsNumber());
        if (balls.isEmpty()) throw new RuntimeException("No balls to undo");

        Ball last = balls.get(balls.size() - 1);
        innings.setRuns(Math.max(0, innings.getRuns() - last.getRuns()));
        if (Boolean.TRUE.equals(last.getIsWicket())) {
            innings.setWickets(Math.max(0, innings.getWickets() - 1));
        }
        if (isLegalDelivery(last.getExtraType())) {
            innings.setBallsBowled(Math.max(0, innings.getBallsBowled() - 1));
        }

        ballRepository.delete(last);
        inningsRepository.save(innings);
        return buildScoreResponse(match, innings, false);
    }

    @Transactional
    public MatchDto.ScoreResponse recordBall(MatchDto.BallRequest request) {
        Match match = matchRepository.findById(request.getMatchId())
                .orElseThrow(() -> new RuntimeException("Match not found"));

        if ("COMPLETED".equals(match.getStatus())) throw new RuntimeException("Match already completed");

        Innings innings = inningsRepository.findByMatchIdAndStatus(request.getMatchId(), "IN_PROGRESS")
                .orElseThrow(() -> new RuntimeException("No active innings. Start next innings."));

        // UI is authoritative for current players
        if (request.getBatsmanId() != null) innings.setStrikerId(request.getBatsmanId());
        if (request.getNonStrikerId() != null) innings.setNonStrikerId(request.getNonStrikerId());
        if (request.getBowlerId() != null) innings.setCurrentBowlerId(request.getBowlerId());

        if (innings.getStrikerId() == null || innings.getNonStrikerId() == null || innings.getCurrentBowlerId() == null) {
            throw new RuntimeException("Select striker, non-striker and bowler");
        }

        String extraType = normalize(extraTypeOrNull(request.getExtraType()));

        int batRuns = request.getBatRuns() != null ? request.getBatRuns()
                : (request.getRuns() != null ? request.getRuns() : 0);
        int extraRunsInput = request.getExtraRuns() != null ? request.getExtraRuns() : 0;

        int extraRunsTotal = computeExtraRuns(extraType, extraRunsInput);
        int totalRuns = Math.max(0, batRuns) + Math.max(0, extraRunsTotal);
        boolean legal = isLegalDelivery(extraType);

        int totalLegalBalls = innings.getBallsBowled();
        int overNumber = totalLegalBalls / 6;
        int ballInOver = totalLegalBalls % 6;

        Ball ball = new Ball();
        ball.setMatch(match);
        ball.setInningsNumber(innings.getInningsNumber());
        ball.setOverNumber(overNumber);
        ball.setBallNumber(ballInOver + 1);
        ball.setBatRuns(Math.max(0, batRuns));
        ball.setExtraRuns(Math.max(0, extraRunsTotal));
        ball.setExtraType(extraType);
        ball.setRuns(totalRuns);
        ball.setIsWicket(request.getIsWicket() != null && request.getIsWicket());
        ball.setBatsmanId(innings.getStrikerId());
        ball.setBowlerId(innings.getCurrentBowlerId());
        ball.setWicketType(normalize(request.getWicketType()));
        ball.setWicketBatsmanId(request.getWicketBatsmanId());
        ball.setFielderId(request.getFielderId());
        ballRepository.save(ball);

        innings.setRuns(innings.getRuns() + ball.getRuns());
        if (Boolean.TRUE.equals(ball.getIsWicket())) innings.setWickets(innings.getWickets() + 1);
        if (legal) innings.setBallsBowled(innings.getBallsBowled() + 1);

        // Strike swap for runs
        if (totalRuns % 2 == 1) {
            Long tmp = innings.getStrikerId();
            innings.setStrikerId(innings.getNonStrikerId());
            innings.setNonStrikerId(tmp);
        }

        // Wicket replacement
        int allOutWickets = allOutWicketsForTeam(innings.getBattingTeam());
        if (Boolean.TRUE.equals(ball.getIsWicket()) && innings.getWickets() < allOutWickets) {
            if (request.getNewBatsmanId() == null) throw new RuntimeException("Select new batsman");
            Long outId = request.getWicketBatsmanId() != null ? request.getWicketBatsmanId() : ball.getBatsmanId();
            if (outId != null && outId.equals(innings.getStrikerId())) {
                innings.setStrikerId(request.getNewBatsmanId());
            } else if (outId != null && outId.equals(innings.getNonStrikerId())) {
                innings.setNonStrikerId(request.getNewBatsmanId());
            } else {
                innings.setStrikerId(request.getNewBatsmanId());
            }
        }

        boolean overEnded = false;
        if (legal && innings.getBallsBowled() % 6 == 0) {
            overEnded = true;
            Long tmp = innings.getStrikerId();
            innings.setStrikerId(innings.getNonStrikerId());
            innings.setNonStrikerId(tmp);
        }

        // Innings completion
        int maxBalls = match.getTotalOvers() * 6;
        boolean inningsCompleted = innings.getWickets() >= allOutWickets || innings.getBallsBowled() >= maxBalls;

        if (innings.getInningsNumber() == 2 && innings.getTargetRuns() != null) {
            if (innings.getRuns() >= innings.getTargetRuns()) inningsCompleted = true;
        }

        if (inningsCompleted) innings.setStatus("COMPLETED");
        inningsRepository.save(innings);

        if ("COMPLETED".equals(innings.getStatus()) && innings.getInningsNumber() == 2) {
            finalizeMatchResult(match);
            matchRepository.save(match);
        }

        return buildScoreResponse(match, innings, overEnded);
    }

    public MatchDto.ScoreResponse getScore(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
        Innings innings = inningsRepository.findByMatchIdAndStatus(matchId, "IN_PROGRESS")
                .orElseGet(() -> inningsRepository.findByMatchIdOrderByInningsNumberAsc(matchId).stream()
                        .reduce((a, b) -> b)
                        .orElseThrow(() -> new RuntimeException("Innings not found")));
        return buildScoreResponse(match, innings, false);
    }

    public List<MatchDto.BallDetailResponse> getBallByBall(Long matchId, Integer inningsNumber) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        int inn = resolveInningsNumber(matchId, inningsNumber);
        List<Ball> balls = ballRepository.findByMatchIdAndInningsNumberOrderByIdAsc(matchId, inn);
        return balls.stream().map(b -> {
            MatchDto.BallDetailResponse r = new MatchDto.BallDetailResponse();
            r.setId(b.getId());
            r.setInningsNumber(b.getInningsNumber());
            r.setOverNumber(b.getOverNumber());
            r.setBallNumber(b.getBallNumber());
            r.setRuns(b.getRuns());
            r.setBatRuns(b.getBatRuns());
            r.setExtraRuns(b.getExtraRuns());
            r.setExtraType(b.getExtraType());
            r.setIsWicket(b.getIsWicket());
            r.setBatsmanId(b.getBatsmanId());
            r.setBatsmanName(resolvePlayerName(b.getBatsmanId()));
            r.setBowlerId(b.getBowlerId());
            r.setBowlerName(resolvePlayerName(b.getBowlerId()));
            r.setWicketType(b.getWicketType());
            r.setWicketBatsmanId(b.getWicketBatsmanId());
            r.setWicketBatsmanName(resolvePlayerName(b.getWicketBatsmanId()));
            r.setFielderId(b.getFielderId());
            r.setFielderName(resolvePlayerName(b.getFielderId()));
            return r;
        }).collect(Collectors.toList());
    }

    private MatchDto.ScoreResponse buildScoreResponse(Match match, Innings innings, boolean overEnded) {
        MatchDto.ScoreResponse response = new MatchDto.ScoreResponse();
        response.setMatchId(match.getId());
        response.setTeamAName(match.getTeamA().getName());
        response.setTeamBName(match.getTeamB().getName());
        response.setTotalOvers(match.getTotalOvers());
        response.setStatus(match.getStatus());
        response.setResultText(match.getResultText());

        response.setInningsNumber(innings.getInningsNumber());
        response.setBattingTeamId(innings.getBattingTeam().getId());
        response.setBattingTeamName(innings.getBattingTeam().getName());
        response.setBowlingTeamId(innings.getBowlingTeam().getId());
        response.setBowlingTeamName(innings.getBowlingTeam().getName());

        response.setRuns(innings.getRuns());
        response.setWickets(innings.getWickets());
        response.setTargetRuns(innings.getTargetRuns());

        int legalBalls = innings.getBallsBowled();
        int completedOvers = legalBalls / 6;
        int ballsInCurrentOver = legalBalls % 6;
        response.setOvers(completedOvers + "." + ballsInCurrentOver);

        response.setRemainingBalls(Math.max(0, match.getTotalOvers() * 6 - legalBalls));
        if (innings.getInningsNumber() == 2 && innings.getTargetRuns() != null) {
            response.setRequiredRuns(Math.max(0, innings.getTargetRuns() - innings.getRuns()));
        }

        response.setStrikerId(innings.getStrikerId());
        response.setNonStrikerId(innings.getNonStrikerId());
        response.setCurrentBowlerId(innings.getCurrentBowlerId());
        response.setStrikerName(resolvePlayerName(innings.getStrikerId()));
        response.setNonStrikerName(resolvePlayerName(innings.getNonStrikerId()));
        response.setCurrentBowlerName(resolvePlayerName(innings.getCurrentBowlerId()));

        List<Ball> lastSix = ballRepository.findTop6ByMatchIdAndInningsNumberOrderByIdDesc(match.getId(), innings.getInningsNumber());
        response.setLastSixBalls(lastSix.stream().map(b -> {
            MatchDto.BallResponse br = new MatchDto.BallResponse();
            br.setId(b.getId());
            br.setOverNumber(b.getOverNumber());
            br.setBallNumber(b.getBallNumber());
            br.setRuns(b.getRuns());
            br.setBatRuns(b.getBatRuns());
            br.setExtraRuns(b.getExtraRuns());
            br.setExtraType(b.getExtraType());
            br.setIsWicket(b.getIsWicket());
            br.setWicketType(b.getWicketType());
            br.setWicketBatsmanId(b.getWicketBatsmanId());
            br.setFielderId(b.getFielderId());
            return br;
        }).collect(Collectors.toList()));

        List<Ball> balls = ballRepository.findByMatchIdAndInningsNumberOrderByOverNumberAscBallNumberAsc(match.getId(), innings.getInningsNumber());
        ExtrasSummary extrasSummary = computeExtras(balls);
        response.setExtrasTotal(extrasSummary.total);
        response.setExtrasBreakdown(extrasSummary.breakdown);
        response.setBattingCard(buildBattingCard(balls));
        response.setBowlingCard(buildBowlingCard(balls));
        response.setOverEnded(overEnded);
        return response;
    }

    private MatchDto.MatchResponse toMatchResponse(Match match) {
        MatchDto.MatchResponse response = new MatchDto.MatchResponse();
        response.setId(match.getId());
        response.setTeamAId(match.getTeamA().getId());
        response.setTeamBId(match.getTeamB().getId());
        response.setTeamAName(match.getTeamA().getName());
        response.setTeamBName(match.getTeamB().getName());
        response.setTotalOvers(match.getTotalOvers());
        response.setStatus(match.getStatus());
        response.setTossWinnerTeamId(match.getTossWinnerTeamId());
        response.setTossDecision(match.getTossDecision());
        response.setWinnerTeamId(match.getWinnerTeamId());
        response.setResultText(match.getResultText());
        response.setManOfTheMatchPlayerId(match.getManOfTheMatchPlayerId());
        response.setManOfTheMatchPlayerName(resolvePlayerName(match.getManOfTheMatchPlayerId()));
        return response;
    }

    private String resolvePlayerName(Long playerId) {
        if (playerId == null) return null;
        return playerRepository.findById(playerId).map(Player::getName).orElse("Unknown");
    }

    private String extraTypeOrNull(String extraType) {
        if (extraType == null) return null;
        String t = extraType.trim();
        return t.isEmpty() ? null : t;
    }

    private String normalize(String v) {
        if (v == null) return null;
        String t = v.trim();
        if (t.isEmpty()) return null;
        return t.toUpperCase(Locale.ROOT);
    }

    private int allOutWicketsForTeam(Team team) {
        int totalPlayers = team != null && team.getPlayers() != null ? team.getPlayers().size() : 0;
        return InningsRules.allOutWickets(totalPlayers);
    }

    private boolean isLegalDelivery(String extraType) {
        if (extraType == null) return true;
        return Set.of("BYE", "LEG_BYE").contains(extraType);
    }

    private int computeExtraRuns(String extraType, int extraRunsInput) {
        if (extraType == null) return 0;
        int x = Math.max(0, extraRunsInput);
        return switch (extraType) {
            case "WIDE", "NO_BALL" -> 1 + x;
            case "BYE", "LEG_BYE", "PENALTY" -> x;
            default -> x;
        };
    }

    private List<MatchDto.BatterLine> buildBattingCard(List<Ball> balls) {
        Map<Long, MatchDto.BatterLine> map = new TreeMap<>();
        for (Ball b : balls) {
            Long pid = b.getBatsmanId();
            if (pid == null) continue;
            MatchDto.BatterLine line = map.computeIfAbsent(pid, k -> {
                MatchDto.BatterLine l = new MatchDto.BatterLine();
                l.setPlayerId(k);
                l.setName(resolvePlayerName(k));
                l.setRuns(0);
                l.setBalls(0);
                l.setFours(0);
                l.setSixes(0);
                l.setOut(false);
                return l;
            });
            line.setRuns(line.getRuns() + Math.max(0, b.getBatRuns()));
            boolean countsBallFaced = b.getExtraType() == null || !"WIDE".equals(b.getExtraType());
            if (countsBallFaced && !"PENALTY".equals(b.getExtraType())) {
                line.setBalls(line.getBalls() + 1);
            }
            if (b.getBatRuns() == 4) line.setFours(line.getFours() + 1);
            if (b.getBatRuns() == 6) line.setSixes(line.getSixes() + 1);
        }

        for (Ball b : balls) {
            if (!Boolean.TRUE.equals(b.getIsWicket())) continue;
            Long outId = b.getWicketBatsmanId() != null ? b.getWicketBatsmanId() : b.getBatsmanId();
            if (outId == null) continue;
            MatchDto.BatterLine line = map.computeIfAbsent(outId, k -> {
                MatchDto.BatterLine l = new MatchDto.BatterLine();
                l.setPlayerId(k);
                l.setName(resolvePlayerName(k));
                l.setRuns(0);
                l.setBalls(0);
                l.setFours(0);
                l.setSixes(0);
                l.setOut(true);
                return l;
            });
            line.setOut(true);
            line.setDismissal(buildDismissalText(b));
        }

        return new ArrayList<>(map.values());
    }

    private String buildDismissalText(Ball b) {
        String wt = b.getWicketType() != null ? b.getWicketType() : "WICKET";
        String bowler = resolvePlayerName(b.getBowlerId());
        String fielder = resolvePlayerName(b.getFielderId());
        return switch (wt) {
            case "BOWLED" -> "b " + (bowler != null ? bowler : "Unknown");
            case "LBW" -> "lbw b " + (bowler != null ? bowler : "Unknown");
            case "CAUGHT" -> "c " + (fielder != null ? fielder : "Unknown") + " b " + (bowler != null ? bowler : "Unknown");
            case "STUMPED" -> "st " + (fielder != null ? fielder : "Unknown") + " b " + (bowler != null ? bowler : "Unknown");
            case "RUN_OUT" -> "run out " + (fielder != null ? fielder : "Unknown");
            default -> "out";
        };
    }

    private List<MatchDto.BowlerLine> buildBowlingCard(List<Ball> balls) {
        Map<Long, BowlerAgg> map = new TreeMap<>();
        for (Ball b : balls) {
            Long pid = b.getBowlerId();
            if (pid == null) continue;
            BowlerAgg agg = map.computeIfAbsent(pid, k -> new BowlerAgg());
            if (isLegalDelivery(b.getExtraType())) agg.legalBalls++;

            int creditedRuns = 0;
            if (b.getExtraType() == null || Set.of("WIDE", "NO_BALL").contains(b.getExtraType())) {
                creditedRuns = b.getRuns();
            }
            agg.runs += creditedRuns;

            boolean wicketCredit = Boolean.TRUE.equals(b.getIsWicket()) && (b.getWicketType() == null || !"RUN_OUT".equals(b.getWicketType()));
            if (wicketCredit) agg.wickets++;

            int overKey = b.getOverNumber();
            agg.overRuns.put(overKey, agg.overRuns.getOrDefault(overKey, 0) + creditedRuns);
        }

        List<MatchDto.BowlerLine> out = new ArrayList<>();
        for (Map.Entry<Long, BowlerAgg> e : map.entrySet()) {
            Long pid = e.getKey();
            BowlerAgg agg = e.getValue();
            MatchDto.BowlerLine line = new MatchDto.BowlerLine();
            line.setPlayerId(pid);
            line.setName(resolvePlayerName(pid));
            line.setRuns(agg.runs);
            line.setWickets(agg.wickets);
            line.setMaidens((int) agg.overRuns.values().stream().filter(v -> v == 0).count());
            int oversFull = agg.legalBalls / 6;
            int ballsPart = agg.legalBalls % 6;
            line.setOvers(oversFull + "." + ballsPart);
            line.setEconomy(agg.legalBalls > 0 ? (agg.runs * 6.0) / agg.legalBalls : 0.0);
            out.add(line);
        }
        return out;
    }

    private void finalizeMatchResult(Match match) {
        List<Innings> inningsList = inningsRepository.findByMatchIdOrderByInningsNumberAsc(match.getId());
        if (inningsList.size() < 2) return;
        Innings inn1 = inningsList.get(0);
        Innings inn2 = inningsList.get(1);

        if (inn2.getTargetRuns() == null) inn2.setTargetRuns(inn1.getRuns() + 1);
        int target = inn2.getTargetRuns();

        Team chasing = inn2.getBattingTeam();
        Team defending = inn2.getBowlingTeam();

        match.setStatus("COMPLETED");
        if (inn2.getRuns() >= target) {
            match.setWinnerTeamId(chasing.getId());
            int wktsRemaining = Math.max(0, allOutWicketsForTeam(chasing) - inn2.getWickets());
            match.setResultText(chasing.getName() + " won by " + wktsRemaining + " wickets");
        } else if (inn2.getRuns() == target - 1) {
            match.setWinnerTeamId(null);
            match.setResultText("Match tied");
        } else {
            match.setWinnerTeamId(defending.getId());
            int runsMargin = Math.max(0, target - 1 - inn2.getRuns());
            match.setResultText(defending.getName() + " won by " + runsMargin + " runs");
        }
    }

    private int resolveInningsNumber(Long matchId, Integer requested) {
        if (requested != null && (requested == 1 || requested == 2)) return requested;
        Optional<Innings> active = inningsRepository.findByMatchIdAndStatus(matchId, "IN_PROGRESS");
        if (active.isPresent()) return active.get().getInningsNumber();
        return inningsRepository.findByMatchIdOrderByInningsNumberAsc(matchId).stream()
                .reduce((a, b) -> b)
                .map(Innings::getInningsNumber)
                .orElse(1);
    }

    private ExtrasSummary computeExtras(List<Ball> balls) {
        Map<String, Integer> breakdown = new LinkedHashMap<>();
        breakdown.put("WIDE", 0);
        breakdown.put("NO_BALL", 0);
        breakdown.put("BYE", 0);
        breakdown.put("LEG_BYE", 0);
        breakdown.put("PENALTY", 0);
        int total = 0;
        for (Ball b : balls) {
            if (b.getExtraType() == null) continue;
            int extra = Math.max(0, b.getExtraRuns() != null ? b.getExtraRuns() : 0);
            total += extra;
            breakdown.put(b.getExtraType(), breakdown.getOrDefault(b.getExtraType(), 0) + extra);
        }
        ExtrasSummary s = new ExtrasSummary();
        s.total = total;
        s.breakdown = breakdown;
        return s;
    }

    private String formatOvers(Integer legalBalls) {
        int lb = legalBalls != null ? legalBalls : 0;
        int oversFull = lb / 6;
        int ballsPart = lb % 6;
        return oversFull + "." + ballsPart;
    }

    private List<MatchDto.WicketFallResponse> buildFallOfWickets(List<Ball> balls) {
        List<MatchDto.WicketFallResponse> out = new ArrayList<>();
        int runs = 0;
        int legalBalls = 0;
        int wicketNo = 0;
        for (Ball b : balls) {
            runs += Math.max(0, b.getRuns() != null ? b.getRuns() : 0);
            if (isLegalDelivery(b.getExtraType())) legalBalls++;
            if (Boolean.TRUE.equals(b.getIsWicket())) {
                wicketNo++;
                MatchDto.WicketFallResponse r = new MatchDto.WicketFallResponse();
                r.setWicketNumber(wicketNo);
                r.setScore(runs);
                r.setOvers(formatOvers(legalBalls));
                Long outId = b.getWicketBatsmanId() != null ? b.getWicketBatsmanId() : b.getBatsmanId();
                r.setBatsmanId(outId);
                r.setBatsmanName(resolvePlayerName(outId));
                r.setWicketType(b.getWicketType());
                out.add(r);
            }
        }
        return out;
    }

    private List<MatchDto.MomCandidateResponse> suggestManOfTheMatch(Long matchId, int limit) {
        List<Ball> balls = ballRepository.findByMatchIdOrderByOverNumberAscBallNumberAsc(matchId);
        if (balls.isEmpty()) return List.of();

        Map<Long, MomAgg> agg = new HashMap<>();
        for (Ball b : balls) {
            // Batting
            if (b.getBatsmanId() != null) {
                MomAgg a = agg.computeIfAbsent(b.getBatsmanId(), k -> new MomAgg());
                a.runs += Math.max(0, b.getBatRuns() != null ? b.getBatRuns() : 0);
                boolean countsBallFaced = b.getExtraType() == null || !"WIDE".equals(b.getExtraType());
                if (countsBallFaced && !"PENALTY".equals(b.getExtraType())) a.ballsFaced++;
                if (b.getBatRuns() != null && b.getBatRuns() == 4) a.fours++;
                if (b.getBatRuns() != null && b.getBatRuns() == 6) a.sixes++;
            }

            // Bowling
            if (b.getBowlerId() != null) {
                MomAgg a = agg.computeIfAbsent(b.getBowlerId(), k -> new MomAgg());
                if (isLegalDelivery(b.getExtraType())) a.legalBallsBowled++;
                int creditedRuns = 0;
                if (b.getExtraType() == null || Set.of("WIDE", "NO_BALL").contains(b.getExtraType())) {
                    creditedRuns = Math.max(0, b.getRuns() != null ? b.getRuns() : 0);
                }
                a.runsConceded += creditedRuns;
                boolean wicketCredit = Boolean.TRUE.equals(b.getIsWicket()) && (b.getWicketType() == null || !"RUN_OUT".equals(b.getWicketType()));
                if (wicketCredit) a.wickets++;
            }
        }

        List<MatchDto.MomCandidateResponse> out = new ArrayList<>();
        for (Map.Entry<Long, MomAgg> e : agg.entrySet()) {
            Long pid = e.getKey();
            MomAgg a = e.getValue();
            double sr = a.ballsFaced > 0 ? (a.runs * 100.0) / a.ballsFaced : 0.0;
            double econ = a.legalBallsBowled > 0 ? (a.runsConceded * 6.0) / a.legalBallsBowled : 0.0;

            // Simple, explainable points model
            double points = 0.0;
            points += a.runs * 1.0;
            points += a.fours * 0.5;
            points += a.sixes * 1.0;
            if (a.runs >= 50) points += 10;
            if (a.runs >= 75) points += 10;
            if (a.ballsFaced >= 10 && sr >= 150) points += 8;
            if (a.ballsFaced >= 10 && sr >= 120) points += 4;

            points += a.wickets * 22.0;
            if (a.wickets >= 3) points += 10;
            if (a.legalBallsBowled >= 12 && econ > 0 && econ <= 6.0) points += 6;
            if (a.legalBallsBowled >= 12 && econ > 0 && econ <= 8.0) points += 3;
            points -= a.runsConceded * 0.25;

            if (points <= 0.0) continue;
            MatchDto.MomCandidateResponse r = new MatchDto.MomCandidateResponse();
            r.setPlayerId(pid);
            r.setName(resolvePlayerName(pid));
            r.setPoints(points);
            r.setRuns(a.runs);
            r.setWickets(a.wickets);
            out.add(r);
        }

        out.sort((a, b) -> Double.compare(b.getPoints(), a.getPoints()));
        return out.stream().limit(Math.max(1, limit)).collect(Collectors.toList());
    }

    private static class BowlerAgg {
        int legalBalls = 0;
        int runs = 0;
        int wickets = 0;
        Map<Integer, Integer> overRuns = new TreeMap<>();
    }

    private static class ExtrasSummary {
        int total;
        Map<String, Integer> breakdown;
    }

    private static class MomAgg {
        int runs = 0;
        int ballsFaced = 0;
        int fours = 0;
        int sixes = 0;
        int wickets = 0;
        int legalBallsBowled = 0;
        int runsConceded = 0;
    }
}
