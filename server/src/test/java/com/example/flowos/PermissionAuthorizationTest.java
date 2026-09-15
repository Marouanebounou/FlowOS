package com.example.flowos;

import com.example.flowos.Dto.TeamRequest;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.OrganisationRepository;
import com.example.flowos.Repositories.TeamMemberRepository;
import com.example.flowos.Repositories.TeamRepository;
import com.example.flowos.Repositories.UserRepository;
import com.example.flowos.Services.AuditLogService;
import com.example.flowos.Services.PermissionSecurity;
import com.example.flowos.Services.TeamService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PermissionAuthorizationTest {
    @Mock
    private OrganisationMemberRepository organisationMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganisationRepository organisationRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private TeamMemberRepository teamMemberRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private PermissionSecurity permissionSecurity;

    @InjectMocks
    private PermissionSecurity standalonePermissionSecurity;

    @InjectMocks
    private TeamService teamService;

    @Test
    void memberWithoutPermissionIsDenied() {
        when(userRepository.existsByEmailAndActiveTrue("member@example.com")).thenReturn(true);
        when(organisationMemberRepository
            .existsByOrganisationIdAndUserEmailAndActiveTrueAndRolePermissionsCode(
                10L,
                "member@example.com",
                "team.create"
            )).thenReturn(false);

        assertFalse(standalonePermissionSecurity.hasPermission(
            "member@example.com",
            10L,
            "team.create"
        ));
        assertThrows(AccessDeniedException.class, () -> standalonePermissionSecurity.requirePermission(
            "member@example.com",
            10L,
            "team.create"
        ));
    }

    @Test
    void teamServiceRejectsCreateBeforeRepositoryAccess() {
        doThrow(new AccessDeniedException("denied"))
            .when(permissionSecurity)
            .requirePermission("member@example.com", 10L, "team.create");

        assertThrows(AccessDeniedException.class, () -> teamService.create(
            "member@example.com",
            10L,
            new TeamRequest("Engineering"),
            "127.0.0.1"
        ));
        verifyNoInteractions(organisationRepository, teamRepository, auditLogService);
    }
}
