package com.example.flowos.Repositories;

import com.example.flowos.Models.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByOrganisationIdOrderByCreatedAtDesc(Long organisationId);
    List<Document> findByOrganisationIdAndTeamIdOrderByCreatedAtDesc(Long organisationId, Long teamId);
    Optional<Document> findByIdAndOrganisationId(Long id, Long organisationId);
}
