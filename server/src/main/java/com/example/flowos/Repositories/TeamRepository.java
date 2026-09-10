package com.example.flowos.Repositories;

import com.example.flowos.Models.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByOrganisationId(Long organisationId);

    Optional<Team> findByIdAndOrganisationId(Long id, Long organisationId);
}
