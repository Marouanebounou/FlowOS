package com.example.flowos;

import com.example.flowos.Dto.ProjectRequest;
import com.example.flowos.Dto.ProjectResponse;
import com.example.flowos.Models.Organisation;
import com.example.flowos.Models.Project;
import com.example.flowos.Models.Team;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.ProjectRepository;
import com.example.flowos.Repositories.TeamRepository;
import com.example.flowos.Repositories.UserRepository;
import com.example.flowos.Services.AuditLogService;
import com.example.flowos.Services.PermissionSecurity;
import com.example.flowos.Services.ProjectService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {
    @Mock private ProjectRepository projectRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private OrganisationMemberRepository organisationMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private PermissionSecurity permissionSecurity;
    @Mock private AuditLogService auditLogService;

    @InjectMocks private ProjectService projectService;

    @Test
    void listDenied() {
        when(organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(10L, "member@example.com", "ADMIN")).thenReturn(false);
        doThrow(new AccessDeniedException("denied")).when(permissionSecurity).requirePermission("member@example.com", 10L, "projects.read");
        assertThrows(AccessDeniedException.class, () -> projectService.list("member@example.com", 10L, 5L));
    }

    @Test
    void createDuplicateNameFails() {
        when(organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(10L, "admin@example.com", "ADMIN")).thenReturn(true);
        Team team = new Team();
        team.setId(5L);
        Organisation org = new Organisation();
        org.setId(10L);
        team.setOrganisation(org);
        when(teamRepository.findByIdAndOrganisationId(5L, 10L)).thenReturn(Optional.of(team));
        User u = new User();
        u.setId(1L);
        u.setEmail("admin@example.com");
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(u));
        when(projectRepository.existsByOrganisationIdAndTeamIdAndNameIgnoreCase(10L, 5L, "Alpha")).thenReturn(true);
        ProjectRequest req = new ProjectRequest("Alpha", null, null);
        assertThrows(IllegalArgumentException.class, () -> projectService.create("admin@example.com", 10L, 5L, req, "127.0.0.1"));
    }

    @Test
    void createSuccess() {
        when(organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(10L, "admin@example.com", "ADMIN")).thenReturn(true);
        Team team = new Team();
        team.setId(5L);
        Organisation org = new Organisation();
        org.setId(10L);
        team.setOrganisation(org);
        when(teamRepository.findByIdAndOrganisationId(5L, 10L)).thenReturn(Optional.of(team));
        User u = new User();
        u.setId(1L);
        u.setEmail("admin@example.com");
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(u));
        when(projectRepository.existsByOrganisationIdAndTeamIdAndNameIgnoreCase(10L, 5L, "Alpha")).thenReturn(false);
        Project saved = new Project();
        saved.setId(20L);
        saved.setName("Alpha");
        saved.setStatus("ACTIVE");
        saved.setTeam(team);
        saved.setOrganisation(org);
        saved.setCreatedBy(u);
        when(projectRepository.save(any(Project.class))).thenReturn(saved);
        ProjectRequest req = new ProjectRequest("Alpha", null, null);
        ProjectResponse res = projectService.create("admin@example.com", 10L, 5L, req, "127.0.0.1");
        assertEquals(20L, res.id());
        assertEquals("Alpha", res.name());
    }
}
