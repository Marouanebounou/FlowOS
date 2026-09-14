package com.example.flowos.Services;

import com.example.flowos.Models.AuditLog;
import com.example.flowos.Models.Organisation;
import com.example.flowos.Repositories.AuditLogRepository;
import com.example.flowos.Repositories.OrganisationRepository;
import com.example.flowos.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final OrganisationRepository organisationRepository;

    public void log(
            String action,
            String entityType,
            Long entityId,
            String details,
            String email,
            String ipAddress) {
        AuditLog auditLog = new AuditLog();
        auditLog.setAction(action);
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setDetails(details);
        auditLog.setIpAddress(ipAddress);

        if (email != null) {
            userRepository.findByEmail(email).ifPresent(auditLog::setUser);
        }

        auditLogRepository.save(auditLog);
    }

    public void logForOrganisation(
            String action,
            String entityType,
            Long entityId,
            String details,
            String email,
            Long organisationId,
            String ipAddress) {
        AuditLog auditLog = new AuditLog();
        auditLog.setAction(action);
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setDetails(details);
        auditLog.setIpAddress(ipAddress);

        if (email != null) {
            userRepository.findByEmail(email).ifPresent(auditLog::setUser);
        }
        if (organisationId != null) {
            Organisation organisation = organisationRepository.findById(organisationId)
                    .orElseThrow(() -> new IllegalArgumentException("Organisation not found"));
            auditLog.setOrganisation(organisation);
        }

        auditLogRepository.save(auditLog);
    }
}