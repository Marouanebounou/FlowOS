package com.example.flowos;

import com.example.flowos.Dto.CalendarEventRequest;
import com.example.flowos.Dto.CalendarEventResponse;
import com.example.flowos.Models.CalendarEvent;
import com.example.flowos.Models.Organisation;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.CalendarEventRepository;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.OrganisationRepository;
import com.example.flowos.Repositories.TeamRepository;
import com.example.flowos.Repositories.UserRepository;
import com.example.flowos.Services.AuditLogService;
import com.example.flowos.Services.CalendarService;
import com.example.flowos.Services.PermissionSecurity;
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
class CalendarServiceTest {
    @Mock private CalendarEventRepository calendarEventRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private OrganisationRepository organisationRepository;
    @Mock private OrganisationMemberRepository organisationMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private PermissionSecurity permissionSecurity;
    @Mock private AuditLogService auditLogService;

    @InjectMocks private CalendarService calendarService;

    @Test
    void listDenied() {
        when(organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(10L, "member@example.com", "ADMIN")).thenReturn(false);
        doThrow(new AccessDeniedException("denied")).when(permissionSecurity).requirePermission("member@example.com", 10L, "calendar.read");
        assertThrows(AccessDeniedException.class, () -> calendarService.list("member@example.com", 10L, null));
    }

    @Test
    void createInvalidDateFails() {
        when(organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(10L, "admin@example.com", "ADMIN")).thenReturn(true);
        User u = new User();
        u.setId(1L);
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(u));
        CalendarEventRequest req = new CalendarEventRequest("Meet", null, null, "2026-09-24T10:00:00", "2026-09-24T09:00:00", null);
        assertThrows(IllegalArgumentException.class, () -> calendarService.create("admin@example.com", 10L, req, "127.0.0.1"));
    }

    @Test
    void createSuccess() {
        when(organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(10L, "admin@example.com", "ADMIN")).thenReturn(true);
        User u = new User();
        u.setId(1L);
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(u));
        Organisation org = new Organisation();
        org.setId(10L);
        when(organisationRepository.findById(10L)).thenReturn(Optional.of(org));
        CalendarEvent saved = new CalendarEvent();
        saved.setId(50L);
        saved.setTitle("Meet");
        saved.setOrganisation(org);
        saved.setCreatedBy(u);
        when(calendarEventRepository.save(any(CalendarEvent.class))).thenReturn(saved);
        CalendarEventRequest req = new CalendarEventRequest("Meet", null, null, "2026-09-24T10:00:00", "2026-09-24T11:00:00", null);
        CalendarEventResponse res = calendarService.create("admin@example.com", 10L, req, "127.0.0.1");
        assertEquals(50L, res.id());
        assertEquals("Meet", res.title());
    }
}
