package com.example.flowos.Repositories;

import com.example.flowos.Models.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByOrganisationIdOrderByCreatedAtDesc(Long organisationId);
    List<Document> findByOrganisationIdAndTeamIdOrderByCreatedAtDesc(Long organisationId, Long teamId);
    Page<Document> findByOrganisationIdOrderByCreatedAtDesc(Long organisationId, Pageable pageable);
    Page<Document> findByOrganisationIdAndTeamIdOrderByCreatedAtDesc(Long organisationId, Long teamId, Pageable pageable);
    Optional<Document> findByIdAndOrganisationId(Long id, Long organisationId);
}
