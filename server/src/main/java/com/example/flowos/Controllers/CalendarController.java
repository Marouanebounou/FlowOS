package com.example.flowos.Controllers;

import com.example.flowos.Dto.CalendarEventRequest;
import com.example.flowos.Dto.CalendarEventResponse;
import com.example.flowos.Services.CalendarService;
import com.example.flowos.Utils.PaginationUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/organisations/{organisationId}/calendar")
@RequiredArgsConstructor
public class CalendarController {
    private final CalendarService calendarService;

    @GetMapping
    public ResponseEntity<Page<CalendarEventResponse>> list(
        Authentication authentication,
        @PathVariable Long organisationId,
        @RequestParam(required = false) Long teamId,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(calendarService.list(authentication.getName(), organisationId, teamId, PaginationUtils.normalize(pageable)));
    }

    @PostMapping
    public ResponseEntity<CalendarEventResponse> create(
        Authentication authentication,
        @PathVariable Long organisationId,
        @Valid @RequestBody CalendarEventRequest req,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(calendarService.create(authentication.getName(), organisationId, req, httpRequest.getRemoteAddr()));
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<CalendarEventResponse> update(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long eventId,
        @Valid @RequestBody CalendarEventRequest req,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(calendarService.update(authentication.getName(), organisationId, eventId, req, httpRequest.getRemoteAddr()));
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> delete(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long eventId,
        HttpServletRequest httpRequest
    ) {
        calendarService.delete(authentication.getName(), organisationId, eventId, httpRequest.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }
}
