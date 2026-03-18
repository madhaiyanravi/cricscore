package com.cricket.controller;

import com.cricket.dto.TeamDto;
import com.cricket.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/players")
@RequiredArgsConstructor
public class PlayerController {

    private final TeamService teamService;

    @PostMapping
    public ResponseEntity<TeamDto.PlayerResponse> addPlayer(@RequestBody TeamDto.AddPlayerRequest request) {
        return ResponseEntity.ok(teamService.addPlayer(request));
    }

    @GetMapping
    public ResponseEntity<List<TeamDto.PlayerResponse>> getAllPlayers() {
        return ResponseEntity.ok(teamService.getAllPlayers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamDto.PlayerResponse> getPlayer(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getPlayer(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeamDto.PlayerResponse> updatePlayer(
            @PathVariable Long id,
            @RequestBody TeamDto.UpdatePlayerRequest request) {
        return ResponseEntity.ok(teamService.updatePlayer(id, request));
    }
}
