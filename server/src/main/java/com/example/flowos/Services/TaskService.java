package com.example.flowos.Services;

import com.example.flowos.Dto.TaskRequest;
import com.example.flowos.Dto.TaskResponse;
import com.example.flowos.Models.OrganisationMember;
import com.example.flowos.Models.Task;
import com.example.flowos.Models.Team;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.TaskRepository;
import com.example.flowos.Repositories.TeamRepository;
import com.example.flowos.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final TeamRepository teamRepository;
    private final OrganisationMemberRepository organisationMemberRepository;
    private final UserRepository userRepository;
    private final PermissionSecurity permissionSecurity;
    private final AuditLogService auditLogService;

    private static final Set<String> VALID_STATUS = Set.of("TODO", "IN_PROGRESS", "DONE");
    private static final Set<String> VALID_PRIORITY = Set.of("LOW", "MEDIUM", "HIGH");

    @Transactional(readOnly = true)
    public List<TaskResponse> list(String email, Long organisationId, Long teamId) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "tasks.read");
        findTeam(organisationId, teamId);
        return taskRepository.findByOrganisationIdAndTeamId(organisationId, teamId)
            .stream().map(TaskResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> listAll(String email, Long organisationId) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "tasks.read");
        return taskRepository.findByOrganisationId(organisationId)
            .stream().map(TaskResponse::from).toList();
    }

    @Transactional
    public TaskResponse create(String email, Long organisationId, Long teamId, TaskRequest req, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "tasks.create");
        Team team = findTeam(organisationId, teamId);
        User creator = findUser(email);

        Task task = new Task();
        task.setTitle(req.title().trim());
        task.setDescription(req.description() != null ? req.description().trim() : null);
        task.setStatus(normalizeStatus(req.status()));
        task.setPriority(normalizePriority(req.priority()));
        task.setTeam(team);
        task.setOrganisation(team.getOrganisation());
        task.setCreatedBy(creator);
        if (req.assigneeId() != null) {
            OrganisationMember assigneeMember = findActiveMember(organisationId, req.assigneeId());
            task.setAssignee(assigneeMember.getUser());
        }
        Task saved = taskRepository.save(task);
        auditLogService.logForOrganisation("TASK_CREATED", "TASK", saved.getId(), "team=" + teamId, email, organisationId, ip);
        return TaskResponse.from(saved);
    }

    @Transactional
    public TaskResponse update(String email, Long organisationId, Long teamId, Long taskId, TaskRequest req, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "tasks.update");
        Task task = findTask(organisationId, teamId, taskId);
        if (req.title() != null && !req.title().isBlank()) task.setTitle(req.title().trim());
        if (req.description() != null) task.setDescription(req.description().trim());
        if (req.status() != null) task.setStatus(normalizeStatus(req.status()));
        if (req.priority() != null) task.setPriority(normalizePriority(req.priority()));
        if (req.assigneeId() != null) {
            if (req.assigneeId() == 0) task.setAssignee(null);
            else {
                OrganisationMember m = findActiveMember(organisationId, req.assigneeId());
                task.setAssignee(m.getUser());
            }
        }

        Task saved = taskRepository.save(task);
        auditLogService.logForOrganisation("TASK_UPDATED", "TASK", taskId, null, email, organisationId, ip);
        return TaskResponse.from(saved);
    }

    @Transactional
    public void delete(String email, Long organisationId, Long teamId, Long taskId, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "tasks.delete");
        Task task = findTask(organisationId, teamId, taskId);
        taskRepository.delete(task);
        auditLogService.logForOrganisation("TASK_DELETED", "TASK", taskId, null, email, organisationId, ip);
    }

    @Transactional
    public TaskResponse assign(String email, Long organisationId, Long teamId, Long taskId, Long assigneeId, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "tasks.assign");
        Task task = findTask(organisationId, teamId, taskId);
        OrganisationMember m = findActiveMember(organisationId, assigneeId);
        task.setAssignee(m.getUser());
        Task saved = taskRepository.save(task);
        auditLogService.logForOrganisation("TASK_ASSIGNED", "TASK", taskId, "user=" + assigneeId, email, organisationId, ip);
        return TaskResponse.from(saved);
    }

    private Team findTeam(Long orgId, Long teamId) {
        return teamRepository.findByIdAndOrganisationId(teamId, orgId)
            .orElseThrow(() -> new IllegalArgumentException("Team not found in this organisation"));
    }

    private Task findTask(Long orgId, Long teamId, Long taskId) {
        return taskRepository.findByIdAndOrganisationIdAndTeamId(taskId, orgId, teamId)
            .orElseThrow(() -> new IllegalArgumentException("Task not found"));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private OrganisationMember findActiveMember(Long orgId, Long userId) {
        OrganisationMember m = organisationMemberRepository.findByOrganisationIdAndUserId(orgId, userId)
            .orElseThrow(() -> new IllegalArgumentException("User not a member of organisation"));
        if (!Boolean.TRUE.equals(m.getActive()) || !Boolean.TRUE.equals(m.getUser().getActive()))
            throw new IllegalArgumentException("User not active");
        return m;
    }

    private String normalizeStatus(String s) {
        if (s == null || s.isBlank()) return "TODO";
        String u = s.trim().toUpperCase();
        if (!VALID_STATUS.contains(u)) throw new IllegalArgumentException("Invalid status: use TODO, IN_PROGRESS, DONE");
        return u;
    }

    private String normalizePriority(String p) {
        if (p == null || p.isBlank()) return "MEDIUM";
        String u = p.trim().toUpperCase();
        if (!VALID_PRIORITY.contains(u)) throw new IllegalArgumentException("Invalid priority: LOW, MEDIUM, HIGH");
        return u;
    }

    private boolean isAdmin(String email, Long organisationId) {
        return organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(organisationId, email, "ADMIN");
    }
}
