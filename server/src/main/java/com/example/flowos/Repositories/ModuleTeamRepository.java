package com.example.flowos.Repositories;

import com.example.flowos.Models.ModuleTeam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ModuleTeamRepository extends JpaRepository<ModuleTeam, Long> {
    List<ModuleTeam> findByInstalledModuleId(Long installedModuleId);
    Optional<ModuleTeam> findByInstalledModuleIdAndTeamId(Long installedModuleId, Long teamId);
    List<ModuleTeam> findByInstalledModuleOrganisationId(Long organisationId);
}
