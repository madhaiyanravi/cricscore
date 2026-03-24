package com.cricket.service;

import com.cricket.dto.AnalyticsDto;
import com.cricket.entity.Ball;
import com.cricket.entity.Match;
import com.cricket.entity.Player;
import com.cricket.repository.BallRepository;
import com.cricket.repository.InningsRepository;
import com.cricket.repository.MatchRepository;
import com.cricket.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final MatchRepository matchRepository;
    private final BallRepository ballRepository;
    private final InningsRepository inningsRepository;
    private final PlayerRepository playerRepository;

    public AnalyticsDto.MatchAnalyticsResponse getMatchAnalytics(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        List<Ball> balls = ballRepository.findByMatchIdOrderByOverNumberAscBallNumberAsc(matchId);

        int totalRuns = inningsRepository.findByMatchIdOrderByInningsNumberAsc(matchId).stream()
                .mapToInt(i -> i.getRuns() != null ? i.getRuns() : 0)
                .sum();
        int totalWickets = inningsRepository.findByMatchIdOrderByInningsNumberAsc(matchId).stream()
                .mapToInt(i -> i.getWickets() != null ? i.getWickets() : 0)
                .sum();

        int fours = 0, sixes = 0, extras = 0, dots = 0;
        Map<Integer, int[]> overMap = new TreeMap<>();

        Map<Long, Integer> batsmanRuns = new HashMap<>();
        Map<Long, Integer> bowlerWickets = new HashMap<>();

        Map<String, Integer> breakdown = new LinkedHashMap<>();
        breakdown.put("DOT", 0);
        breakdown.put("SINGLE", 0);
        breakdown.put("TWO", 0);
        breakdown.put("THREE", 0);
        breakdown.put("FOUR", 0);
        breakdown.put("SIX", 0);
        breakdown.put("EXTRA", 0);
        breakdown.put("WICKET", 0);

        for (Ball b : balls) {
            boolean isExtra = b.getExtraType() != null;
            if (isExtra) {
                extras += Math.max(0, b.getExtraRuns());
                breakdown.merge("EXTRA", 1, Integer::sum);
            }

            if (b.getBatRuns() == 4) {
                fours++;
                breakdown.merge("FOUR", 1, Integer::sum);
            } else if (b.getBatRuns() == 6) {
                sixes++;
                breakdown.merge("SIX", 1, Integer::sum);
            } else if (b.getRuns() == 0 && !isExtra && !Boolean.TRUE.equals(b.getIsWicket())) {
                dots++;
                breakdown.merge("DOT", 1, Integer::sum);
            } else if (b.getRuns() == 1) breakdown.merge("SINGLE", 1, Integer::sum);
            else if (b.getRuns() == 2) breakdown.merge("TWO", 1, Integer::sum);
            else if (b.getRuns() == 3) breakdown.merge("THREE", 1, Integer::sum);

            if (Boolean.TRUE.equals(b.getIsWicket())) breakdown.merge("WICKET", 1, Integer::sum);

            int ov = b.getOverNumber() + 1;
            overMap.computeIfAbsent(ov, k -> new int[]{0, 0});
            overMap.get(ov)[0] += b.getRuns();
            if (Boolean.TRUE.equals(b.getIsWicket())) overMap.get(ov)[1]++;

            if (b.getBatsmanId() != null) batsmanRuns.merge(b.getBatsmanId(), b.getBatRuns(), Integer::sum);
            if (b.getBowlerId() != null && Boolean.TRUE.equals(b.getIsWicket())) bowlerWickets.merge(b.getBowlerId(), 1, Integer::sum);
        }

        String topScorerName = null;
        int topScorerRuns = 0;
        for (Map.Entry<Long, Integer> e : batsmanRuns.entrySet()) {
            if (e.getValue() > topScorerRuns) {
                topScorerRuns = e.getValue();
                topScorerName = playerRepository.findById(e.getKey()).map(Player::getName).orElse("Unknown");
            }
        }

        String topBowlerName = null;
        int topBowlerWickets = 0;
        for (Map.Entry<Long, Integer> e : bowlerWickets.entrySet()) {
            if (e.getValue() > topBowlerWickets) {
                topBowlerWickets = e.getValue();
                topBowlerName = playerRepository.findById(e.getKey()).map(Player::getName).orElse("Unknown");
            }
        }

        List<AnalyticsDto.OverData> overByOver = new ArrayList<>();
        int cumulativeRuns = 0;
        int ballsTotal = 0;
        for (Map.Entry<Integer, int[]> e : overMap.entrySet()) {
            cumulativeRuns += e.getValue()[0];
            ballsTotal += 6;
            AnalyticsDto.OverData od = new AnalyticsDto.OverData();
            od.setOver(e.getKey());
            od.setRuns(e.getValue()[0]);
            od.setWickets(e.getValue()[1]);
            od.setRunRate(ballsTotal > 0 ? (cumulativeRuns * 6.0) / ballsTotal : 0.0);
            overByOver.add(od);
        }

        AnalyticsDto.MatchAnalyticsResponse resp = new AnalyticsDto.MatchAnalyticsResponse();
        resp.setMatchId(matchId);
        resp.setTeamAName(match.getTeamA().getName());
        resp.setTeamBName(match.getTeamB().getName());
        resp.setTotalRuns(totalRuns);
        resp.setTotalWickets(totalWickets);
        resp.setTotalFours(fours);
        resp.setTotalSixes(sixes);
        resp.setTotalExtras(extras);
        resp.setDotBalls(dots);
        resp.setTopScorerName(topScorerName);
        resp.setTopScorerRuns(topScorerRuns);
        resp.setTopBowlerName(topBowlerName);
        resp.setTopBowlerWickets(topBowlerWickets);
        resp.setOverByOver(overByOver);
        resp.setRunsBreakdown(breakdown);
        return resp;
    }
}

