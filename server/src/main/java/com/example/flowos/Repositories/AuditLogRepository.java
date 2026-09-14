package com.example.flowos.Repositories;

import com.example.flowos.Models.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByOrganisationIdOrderByCreatedAtDesc(Long organisationId);

    @Modifying
    @Query("update AuditLog auditLog set auditLog.organisation = null where auditLog.organisation.id = :organisationId")
    void detachFromOrganisation(@Param("organisationId") Long organisationId);
}
