package com.example.flowos.Repositories;

import com.example.flowos.Models.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOrganisationIdAndTeamId(Long organisationId, Long teamId);
    Optional<Project> findByIdAndOrganisationIdAndTeamId(Long id, Long organisationId, Long teamId);
    boolean existsByOrganisationIdAndTeamIdAndNameIgnoreCase(Long organisationId, Long teamId, String name);
}
