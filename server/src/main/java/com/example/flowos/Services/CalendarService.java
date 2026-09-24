package com.example.flowos.Services;

import com.example.flowos.Dto.CalendarEventRequest;
import com.example.flowos.Dto.CalendarEventResponse;
import com.example.flowos.Models.CalendarEvent;
import com.example.flowos.Models.Team;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.CalendarEventRepository;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.OrganisationRepository;
import com.example.flowos.Repositories.TeamRepository;
import com.example.flowos.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarService {
    private final CalendarEventRepository calendarEventRepository;
    private final TeamRepository teamRepository;
    private final OrganisationRepository organisationRepository;
    private final OrganisationMemberRepository organisationMemberRepository;
    private final UserRepository userRepository;
    private final PermissionSecurity permissionSecurity;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> list(String email, Long organisationId, Long teamId) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "calendar.read");
        if (teamId != null) {
            return calendarEventRepository.findByOrganisationIdAndTeamIdOrderByStartAtAsc(organisationId, teamId).stream().map(CalendarEventResponse::from).toList();
        }
        return calendarEventRepository.findByOrganisationIdOrderByStartAtAsc(organisationId).stream().map(CalendarEventResponse::from).toList();
    }

    @Transactional
    public CalendarEventResponse create(String email, Long organisationId, CalendarEventRequest req, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "calendar.create");
        User creator = findUser(email);
        Team team = null;
        if (req.teamId() != null) {
            team = teamRepository.findByIdAndOrganisationId(req.teamId(), organisationId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        }
        LocalDateTime start = parseDate(req.startAt(), "startAt");
        LocalDateTime end = parseDate(req.endAt(), "endAt");
        if (!end.isAfter(start)) throw new IllegalArgumentException("endAt must be after startAt");

        CalendarEvent e = new CalendarEvent();
        e.setTitle(req.title().trim());
        e.setDescription(req.description() != null ? req.description().trim() : null);
        e.setLocation(req.location() != null ? req.location().trim() : null);
        e.setStartAt(start);
        e.setEndAt(end);
        e.setTeam(team);
        e.setOrganisation(team != null ? team.getOrganisation() : organisationRepository.findById(organisationId).orElseThrow(() -> new IllegalArgumentException("Organisation not found")));
        e.setCreatedBy(creator);
        CalendarEvent saved = calendarEventRepository.save(e);
        auditLogService.logForOrganisation("CALENDAR_CREATED", "CALENDAR", saved.getId(), null, email, organisationId, ip);
        return CalendarEventResponse.from(saved);
    }

    @Transactional
    public CalendarEventResponse update(String email, Long organisationId, Long eventId, CalendarEventRequest req, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "calendar.update");
        CalendarEvent e = calendarEventRepository.findByIdAndOrganisationId(eventId, organisationId)
            .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        if (req.title() != null && !req.title().isBlank()) e.setTitle(req.title().trim());
        if (req.description() != null) e.setDescription(req.description().trim());
        if (req.location() != null) e.setLocation(req.location().trim());
        if (req.startAt() != null) e.setStartAt(parseDate(req.startAt(), "startAt"));
        if (req.endAt() != null) e.setEndAt(parseDate(req.endAt(), "endAt"));
        if (req.teamId() != null) {
            Team team = teamRepository.findByIdAndOrganisationId(req.teamId(), organisationId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
            e.setTeam(team);
        }
        if (!e.getEndAt().isAfter(e.getStartAt())) throw new IllegalArgumentException("endAt must be after startAt");
        CalendarEvent saved = calendarEventRepository.save(e);
        auditLogService.logForOrganisation("CALENDAR_UPDATED", "CALENDAR", eventId, null, email, organisationId, ip);
        return CalendarEventResponse.from(saved);
    }

    @Transactional
    public void delete(String email, Long organisationId, Long eventId, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "calendar.delete");
        CalendarEvent e = calendarEventRepository.findByIdAndOrganisationId(eventId, organisationId)
            .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        calendarEventRepository.delete(e);
        auditLogService.logForOrganisation("CALENDAR_DELETED", "CALENDAR", eventId, null, email, organisationId, ip);
    }

    private LocalDateTime parseDate(String s, String field) {
        if (s == null || s.isBlank()) throw new IllegalArgumentException(field + " is required");
        try {
            return LocalDateTime.parse(s);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(field + " must be ISO date-time like 2026-09-24T10:00");
        }
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private boolean isAdmin(String email, Long orgId) {
        return organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(orgId, email, "ADMIN");
    }
}
