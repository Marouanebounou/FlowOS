package com.example.flowos.Repositories;

import com.example.flowos.Models.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByOrganisationIdAndTeamId(Long organisationId, Long teamId);
    Page<Task> findByOrganisationIdAndTeamId(Long organisationId, Long teamId, Pageable pageable);
    List<Task> findByOrganisationId(Long organisationId);
    Optional<Task> findByIdAndOrganisationIdAndTeamId(Long id, Long organisationId, Long teamId);
}
