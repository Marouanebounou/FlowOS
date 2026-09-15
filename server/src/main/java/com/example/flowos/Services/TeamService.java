package com.example.flowos.Services;

import com.example.flowos.Dto.TeamRequest;
import com.example.flowos.Dto.TeamResponse;
import com.example.flowos.Dto.TeamMemberResponse;
import com.example.flowos.Models.Organisation;
import com.example.flowos.Models.OrganisationMember;
import com.example.flowos.Models.Team;
import com.example.flowos.Models.TeamMember;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.OrganisationRepository;
import com.example.flowos.Repositories.TeamRepository;
import com.example.flowos.Repositories.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamService {
    private final OrganisationRepository organisationRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final OrganisationMemberRepository organisationMemberRepository;
    private final AuditLogService auditLogService;
    private final PermissionSecurity permissionSecurity;

    @Transactional(readOnly = true)
    public List<TeamResponse> list(String email, Long organisationId) {
        permissionSecurity.requirePermission(email, organisationId, "team.read");
        findOrganisation(organisationId);
        return teamRepository.findByOrganisationId(organisationId)
            .stream()
            .map(TeamResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public TeamResponse get(String email, Long organisationId, Long teamId) {
        permissionSecurity.requirePermission(email, organisationId, "team.read");
        return TeamResponse.from(findTeam(organisationId, teamId));
    }

    @Transactional(readOnly = true)
    public List<TeamMemberResponse> listMembers(String email, Long organisationId, Long teamId) {
        permissionSecurity.requirePermission(email, organisationId, "team.read");
        findTeam(organisationId, teamId);
        return teamMemberRepository.findByTeamId(teamId)
            .stream()
            .map(TeamMemberResponse::from)
            .toList();
    }

    @Transactional
    public TeamMemberResponse addMember(
        String adminEmail,
        Long organisationId,
        Long teamId,
        Long userId,
        String ipAddress
    ) {
        permissionSecurity.requirePermission(adminEmail, organisationId, "team.member.add");
        Team team = findTeam(organisationId, teamId);
        OrganisationMember organisationMember = findActiveOrganisationMember(organisationId, userId);

        if (teamMemberRepository.findByTeamIdAndOrganisationMemberId(teamId, organisationMember.getId()).isPresent()) {
            throw new IllegalArgumentException("User is already a member of this team");
        }

        TeamMember teamMember = new TeamMember();
        teamMember.setTeam(team);
        teamMember.setOrganisationMember(organisationMember);
        TeamMember savedMember = teamMemberRepository.save(teamMember);
        auditLogService.logForOrganisation(
            "TEAM_MEMBER_ADDED",
            "TEAM",
            teamId,
            "user_id=" + userId,
            adminEmail,
            organisationId,
            ipAddress
        );
        return TeamMemberResponse.from(savedMember);
    }

    @Transactional
    public void removeMember(
        String adminEmail,
        Long organisationId,
        Long teamId,
        Long userId,
        String ipAddress
    ) {
        permissionSecurity.requirePermission(adminEmail, organisationId, "team.member.remove");
        findTeam(organisationId, teamId);
        OrganisationMember organisationMember = findOrganisationMember(organisationId, userId);
        TeamMember teamMember = teamMemberRepository
            .findByTeamIdAndOrganisationMemberId(teamId, organisationMember.getId())
            .orElseThrow(() -> new IllegalArgumentException("User is not a member of this team"));
        teamMemberRepository.delete(teamMember);
        auditLogService.logForOrganisation(
            "TEAM_MEMBER_REMOVED",
            "TEAM",
            teamId,
            "user_id=" + userId,
            adminEmail,
            organisationId,
            ipAddress
        );
    }

    @Transactional
    public TeamMemberResponse assignLeader(
        String adminEmail,
        Long organisationId,
        Long teamId,
        Long userId,
        String ipAddress
    ) {
        permissionSecurity.requirePermission(adminEmail, organisationId, "team.leader.assign");
        Team team = findTeam(organisationId, teamId);
        OrganisationMember organisationMember = findActiveOrganisationMember(organisationId, userId);
        TeamMember teamMember = teamMemberRepository
            .findByTeamIdAndOrganisationMemberId(teamId, organisationMember.getId())
            .orElseGet(() -> {
                TeamMember newMember = new TeamMember();
                newMember.setTeam(team);
                newMember.setOrganisationMember(organisationMember);
                return teamMemberRepository.save(newMember);
            });

        teamMemberRepository.findByTeamId(teamId).forEach(member -> member.setLeader(false));
        teamMember.setLeader(true);
        TeamMember savedMember = teamMemberRepository.save(teamMember);
        auditLogService.logForOrganisation(
            "TEAM_LEADER_ASSIGNED",
            "TEAM",
            teamId,
            "user_id=" + userId,
            adminEmail,
            organisationId,
            ipAddress
        );
        return TeamMemberResponse.from(savedMember);
    }

    @Transactional
    public TeamResponse create(
        String adminEmail,
        Long organisationId,
        TeamRequest request,
        String ipAddress
    ) {
        permissionSecurity.requirePermission(adminEmail, organisationId, "team.create");
        Organisation organisation = findOrganisation(organisationId);
        String name = normalizeName(request.name());
        ensureNameAvailable(organisationId, name, null);

        Team team = new Team();
        team.setName(name);
        team.setOrganisation(organisation);
        Team savedTeam = teamRepository.save(team);

        auditLogService.logForOrganisation(
            "TEAM_CREATED",
            "TEAM",
            savedTeam.getId(),
            null,
            adminEmail,
            organisationId,
            ipAddress
        );
        return TeamResponse.from(savedTeam);
    }

    @Transactional
    public TeamResponse update(
        String adminEmail,
        Long organisationId,
        Long teamId,
        TeamRequest request,
        String ipAddress
    ) {
        permissionSecurity.requirePermission(adminEmail, organisationId, "team.update");
        Team team = findTeam(organisationId, teamId);
        String name = normalizeName(request.name());
        ensureNameAvailable(organisationId, name, teamId);
        team.setName(name);
        Team savedTeam = teamRepository.save(team);

        auditLogService.logForOrganisation(
            "TEAM_UPDATED",
            "TEAM",
            teamId,
            null,
            adminEmail,
            organisationId,
            ipAddress
        );
        return TeamResponse.from(savedTeam);
    }

    @Transactional
    public void delete(String adminEmail, Long organisationId, Long teamId, String ipAddress) {
        permissionSecurity.requirePermission(adminEmail, organisationId, "team.delete");
        Team team = findTeam(organisationId, teamId);
        teamRepository.delete(team);
        auditLogService.logForOrganisation(
            "TEAM_DELETED",
            "TEAM",
            teamId,
            null,
            adminEmail,
            organisationId,
            ipAddress
        );
    }

    private Organisation findOrganisation(Long organisationId) {
        return organisationRepository.findById(organisationId)
            .orElseThrow(() -> new IllegalArgumentException("Organisation not found"));
    }

    private Team findTeam(Long organisationId, Long teamId) {
        return teamRepository.findByIdAndOrganisationId(teamId, organisationId)
            .orElseThrow(() -> new IllegalArgumentException("Team not found in this organisation"));
    }

    private OrganisationMember findOrganisationMember(Long organisationId, Long userId) {
        return organisationMemberRepository.findByOrganisationIdAndUserId(organisationId, userId)
            .orElseThrow(() -> new IllegalArgumentException("User is not a member of this organisation"));
    }

    private OrganisationMember findActiveOrganisationMember(Long organisationId, Long userId) {
        OrganisationMember member = findOrganisationMember(organisationId, userId);
        if (!Boolean.TRUE.equals(member.getActive()) || !Boolean.TRUE.equals(member.getUser().getActive())) {
            throw new IllegalArgumentException("User is not active in this organisation");
        }
        return member;
    }

    private void ensureNameAvailable(Long organisationId, String name, Long excludedTeamId) {
        boolean exists = teamRepository.existsByOrganisationIdAndNameIgnoreCase(organisationId, name);
        if (exists && (excludedTeamId == null
            || teamRepository.findByIdAndOrganisationId(excludedTeamId, organisationId)
                .map(team -> !team.getName().equalsIgnoreCase(name))
                .orElse(true))) {
            throw new IllegalArgumentException("A team with this name already exists");
        }
    }

    private String normalizeName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Team name is required");
        }
        return name.trim();
    }
}
