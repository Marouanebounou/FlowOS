package com.example.flowos.Repositories;

import com.example.flowos.Models.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    List<CalendarEvent> findByOrganisationIdOrderByStartAtAsc(Long organisationId);
    List<CalendarEvent> findByOrganisationIdAndTeamIdOrderByStartAtAsc(Long organisationId, Long teamId);
    Optional<CalendarEvent> findByIdAndOrganisationId(Long id, Long organisationId);
}
