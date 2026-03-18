package com.cricket.service;

import com.cricket.dto.TeamDto;
import com.cricket.entity.Player;
import com.cricket.entity.Team;
import com.cricket.repository.PlayerRepository;
import com.cricket.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository   teamRepository;
    private final PlayerRepository playerRepository;

    // ── Teams ─────────────────────────────────────────────────────────────────
    public TeamDto.TeamResponse createTeam(TeamDto.CreateTeamRequest req) {
        Team team = new Team();
        team.setName(req.getName());
        teamRepository.save(team);
        return toTeamResponse(team);
    }

    public List<TeamDto.TeamResponse> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(this::toTeamResponse)
                .collect(Collectors.toList());
    }

    public TeamDto.TeamResponse getTeam(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        return toTeamResponse(team);
    }

    // ── Players ───────────────────────────────────────────────────────────────
    public TeamDto.PlayerResponse addPlayer(TeamDto.AddPlayerRequest req) {
        Team team = teamRepository.findById(req.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found"));

        Player p = new Player();
        p.setName(req.getName());
        p.setTeam(team);
        p.setBattingStyle(req.getBattingStyle());
        p.setBowlingStyle(req.getBowlingStyle());
        p.setRole(req.getRole());
        p.setAvatarUrl(req.getAvatarUrl());
        p.setJerseyNumber(req.getJerseyNumber());
        p.setBio(req.getBio());
        playerRepository.save(p);
        return toPlayerResponse(p);
    }

    public TeamDto.PlayerResponse getPlayer(Long id) {
        Player p = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        return toPlayerResponse(p);
    }

    public List<TeamDto.PlayerResponse> getAllPlayers() {
        return playerRepository.findAll().stream()
                .map(this::toPlayerResponse)
                .collect(Collectors.toList());
    }

    public TeamDto.PlayerResponse updatePlayer(Long id, TeamDto.UpdatePlayerRequest req) {
        Player p = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        if (req.getName()         != null) p.setName(req.getName());
        if (req.getBattingStyle() != null) p.setBattingStyle(req.getBattingStyle());
        if (req.getBowlingStyle() != null) p.setBowlingStyle(req.getBowlingStyle());
        if (req.getRole()         != null) p.setRole(req.getRole());
        if (req.getAvatarUrl()    != null) p.setAvatarUrl(req.getAvatarUrl());
        if (req.getJerseyNumber() != null) p.setJerseyNumber(req.getJerseyNumber());
        if (req.getBio()          != null) p.setBio(req.getBio());
        playerRepository.save(p);
        return toPlayerResponse(p);
    }

    // ── Mappers ───────────────────────────────────────────────────────────────
    public TeamDto.PlayerResponse toPlayerResponse(Player p) {
        TeamDto.PlayerResponse r = new TeamDto.PlayerResponse();
        r.setId(p.getId());
        r.setName(p.getName());
        r.setAvatarUrl(p.getAvatarUrl());
        r.setBattingStyle(p.getBattingStyle());
        r.setBowlingStyle(p.getBowlingStyle());
        r.setRole(p.getRole());
        r.setJerseyNumber(p.getJerseyNumber());
        r.setBio(p.getBio());
        r.setTotalMatches(p.getTotalMatches());
        r.setTotalRuns(p.getTotalRuns());
        r.setTotalWickets(p.getTotalWickets());
        r.setHighestScore(p.getHighestScore());
        r.setTotalFours(p.getTotalFours());
        r.setTotalSixes(p.getTotalSixes());
        r.setTotalBallsFaced(p.getTotalBallsFaced());

        // Computed
        int innings = Math.max(1, p.getTotalMatches());
        r.setBattingAverage(p.getTotalDismissals() > 0
                ? (double) p.getTotalRuns() / p.getTotalDismissals() : (double) p.getTotalRuns());
        r.setStrikeRate(p.getTotalBallsFaced() > 0
                ? (p.getTotalRuns() * 100.0) / p.getTotalBallsFaced() : 0.0);
        r.setBowlingAverage(p.getTotalWickets() > 0
                ? (double) p.getTotalRunsConceded() / p.getTotalWickets() : 0.0);
        r.setEconomyRate(p.getTotalBallsBowled() > 0
                ? (p.getTotalRunsConceded() * 6.0) / p.getTotalBallsBowled() : 0.0);
        return r;
    }

    private TeamDto.TeamResponse toTeamResponse(Team team) {
        TeamDto.TeamResponse r = new TeamDto.TeamResponse();
        r.setId(team.getId());
        r.setName(team.getName());
        r.setPlayers(team.getPlayers().stream().map(this::toPlayerResponse).collect(Collectors.toList()));
        return r;
    }
}
