package com.example.flowos.Services;

import com.example.flowos.Dto.ProjectRequest;
import com.example.flowos.Dto.ProjectResponse;
import com.example.flowos.Models.Project;
import com.example.flowos.Models.Team;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.ProjectRepository;
import com.example.flowos.Repositories.TeamRepository;
import com.example.flowos.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;
    private final OrganisationMemberRepository organisationMemberRepository;
    private final UserRepository userRepository;
    private final PermissionSecurity permissionSecurity;
    private final AuditLogService auditLogService;

    private static final Set<String> VALID_STATUS = Set.of("PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED");

    @Transactional(readOnly = true)
    public List<ProjectResponse> list(String email, Long organisationId, Long teamId) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "projects.read");
        findTeam(organisationId, teamId);
        return projectRepository.findByOrganisationIdAndTeamId(organisationId, teamId).stream().map(ProjectResponse::from).toList();
    }

    @Transactional
    public ProjectResponse create(String email, Long organisationId, Long teamId, ProjectRequest req, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "projects.create");
        Team team = findTeam(organisationId, teamId);
        User creator = findUser(email);
        String name = req.name().trim();
        if (projectRepository.existsByOrganisationIdAndTeamIdAndNameIgnoreCase(organisationId, teamId, name))
            throw new IllegalArgumentException("Project with this name already exists in this team");
        Project p = new Project();
        p.setName(name);
        p.setDescription(req.description() != null ? req.description().trim() : null);
        p.setStatus(normalizeStatus(req.status()));
        p.setTeam(team);
        p.setOrganisation(team.getOrganisation());
        p.setCreatedBy(creator);
        Project saved = projectRepository.save(p);
        auditLogService.logForOrganisation("PROJECT_CREATED", "PROJECT", saved.getId(), "team=" + teamId, email, organisationId, ip);
        return ProjectResponse.from(saved);
    }

    @Transactional
    public ProjectResponse update(String email, Long organisationId, Long teamId, Long projectId, ProjectRequest req, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "projects.update");
        Project p = findProject(organisationId, teamId, projectId);
        if (req.name() != null && !req.name().isBlank()) {
            String name = req.name().trim();
            if (!p.getName().equalsIgnoreCase(name) && projectRepository.existsByOrganisationIdAndTeamIdAndNameIgnoreCase(organisationId, teamId, name))
                throw new IllegalArgumentException("Project with this name already exists");
            p.setName(name);
        }
        if (req.description() != null) p.setDescription(req.description().trim());
        if (req.status() != null) p.setStatus(normalizeStatus(req.status()));
        Project saved = projectRepository.save(p);
        auditLogService.logForOrganisation("PROJECT_UPDATED", "PROJECT", projectId, null, email, organisationId, ip);
        return ProjectResponse.from(saved);
    }

    @Transactional
    public void delete(String email, Long organisationId, Long teamId, Long projectId, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "projects.delete");
        Project p = findProject(organisationId, teamId, projectId);
        projectRepository.delete(p);
        auditLogService.logForOrganisation("PROJECT_DELETED", "PROJECT", projectId, null, email, organisationId, ip);
    }

    private Team findTeam(Long orgId, Long teamId) {
        return teamRepository.findByIdAndOrganisationId(teamId, orgId).orElseThrow(() -> new IllegalArgumentException("Team not found"));
    }

    private Project findProject(Long orgId, Long teamId, Long projectId) {
        return projectRepository.findByIdAndOrganisationIdAndTeamId(projectId, orgId, teamId).orElseThrow(() -> new IllegalArgumentException("Project not found"));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private String normalizeStatus(String s) {
        if (s == null || s.isBlank()) return "ACTIVE";
        String u = s.trim().toUpperCase();
        if (!VALID_STATUS.contains(u)) throw new IllegalArgumentException("Invalid status: PLANNING, ACTIVE, COMPLETED, ARCHIVED");
        return u;
    }

    private boolean isAdmin(String email, Long orgId) {
        return organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(orgId, email, "ADMIN");
    }
}
