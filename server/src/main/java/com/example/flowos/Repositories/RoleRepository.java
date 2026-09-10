package com.example.flowos.Repositories;

import com.example.flowos.Models.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    List<Role> findByOrganisationId(Long organisationId);

    Optional<Role> findByIdAndOrganisationId(Long id, Long organisationId);
}
