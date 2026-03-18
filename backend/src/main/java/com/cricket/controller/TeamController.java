package com.cricket.controller;

import com.cricket.dto.TeamDto;
import com.cricket.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    public ResponseEntity<TeamDto.TeamResponse> createTeam(@RequestBody TeamDto.CreateTeamRequest request) {
        return ResponseEntity.ok(teamService.createTeam(request));
    }

    @GetMapping
    public ResponseEntity<List<TeamDto.TeamResponse>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamDto.TeamResponse> getTeam(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeam(id));
    }
}
