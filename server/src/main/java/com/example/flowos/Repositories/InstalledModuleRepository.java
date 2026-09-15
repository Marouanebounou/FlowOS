package com.example.flowos.Repositories;

import com.example.flowos.Models.InstalledModule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstalledModuleRepository extends JpaRepository<InstalledModule, Long> {
    List<InstalledModule> findByOrganisationId(Long organisationId);

    Optional<InstalledModule> findByOrganisationIdAndModuleId(Long organisationId, Long moduleId);
}
