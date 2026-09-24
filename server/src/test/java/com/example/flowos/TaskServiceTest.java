package com.example.flowos;

import com.example.flowos.Dto.TaskRequest;
import com.example.flowos.Dto.TaskResponse;
import com.example.flowos.Models.Organisation;
import com.example.flowos.Models.OrganisationMember;
import com.example.flowos.Models.Task;
import com.example.flowos.Models.Team;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.TaskRepository;
import com.example.flowos.Repositories.TeamRepository;
import com.example.flowos.Repositories.UserRepository;
import com.example.flowos.Services.AuditLogService;
import com.example.flowos.Services.PermissionSecurity;
import com.example.flowos.Services.TaskService;
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
class TaskServiceTest {
    @Mock private TaskRepository taskRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private OrganisationMemberRepository organisationMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private PermissionSecurity permissionSecurity;
    @Mock private AuditLogService auditLogService;

    @InjectMocks private TaskService taskService;

    @Test
    void createDeniedWithoutPermission() {
        when(organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(10L, "member@example.com", "ADMIN")).thenReturn(false);
        doThrow(new AccessDeniedException("denied")).when(permissionSecurity).requirePermission("member@example.com", 10L, "tasks.create");
        TaskRequest req = new TaskRequest("Title", null, null, null, null);
        assertThrows(AccessDeniedException.class, () -> taskService.create("member@example.com", 10L, 5L, req, "127.0.0.1"));
    }

    @Test
    void createSuccessAsAdminBypass() {
        when(organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(10L, "admin@example.com", "ADMIN")).thenReturn(true);
        Organisation org = new Organisation();
        org.setId(10L);
        Team team = new Team();
        team.setId(5L);
        team.setOrganisation(org);
        team.setName("Eng");
        when(teamRepository.findByIdAndOrganisationId(5L, 10L)).thenReturn(Optional.of(team));
        User creator = new User();
        creator.setId(1L);
        creator.setEmail("admin@example.com");
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(creator));
        Task saved = new Task();
        saved.setId(100L);
        saved.setTitle("Title");
        saved.setStatus("TODO");
        saved.setPriority("MEDIUM");
        saved.setTeam(team);
        saved.setOrganisation(org);
        saved.setCreatedBy(creator);
        when(taskRepository.save(any(Task.class))).thenReturn(saved);
        TaskRequest req = new TaskRequest("Title", null, null, null, null);
        TaskResponse res = taskService.create("admin@example.com", 10L, 5L, req, "127.0.0.1");
        assertEquals(100L, res.id());
        assertEquals("Title", res.title());
    }

    @Test
    void createFailsWhenTeamMissing() {
        when(organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(10L, "admin@example.com", "ADMIN")).thenReturn(true);
        when(teamRepository.findByIdAndOrganisationId(5L, 10L)).thenReturn(Optional.empty());
        TaskRequest req = new TaskRequest("Title", null, null, null, null);
        assertThrows(IllegalArgumentException.class, () -> taskService.create("admin@example.com", 10L, 5L, req, "127.0.0.1"));
    }
}
