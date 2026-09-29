package com.example.flowos.Repositories;

import com.example.flowos.Models.CrmContact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CrmContactRepository extends JpaRepository<CrmContact, Long> {
    List<CrmContact> findByOrganisationIdOrderByCreatedAtDesc(Long organisationId);
    List<CrmContact> findByOrganisationIdAndTeamIdOrderByCreatedAtDesc(Long organisationId, Long teamId);
    Page<CrmContact> findByOrganisationIdOrderByCreatedAtDesc(Long organisationId, Pageable pageable);
    Page<CrmContact> findByOrganisationIdAndTeamIdOrderByCreatedAtDesc(Long organisationId, Long teamId, Pageable pageable);
    Optional<CrmContact> findByIdAndOrganisationId(Long id, Long organisationId);
}
