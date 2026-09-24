package com.example.flowos.Services;

import com.example.flowos.Dto.DocumentRequest;
import com.example.flowos.Dto.DocumentResponse;
import com.example.flowos.Models.Document;
import com.example.flowos.Models.Team;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.DocumentRepository;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.OrganisationRepository;
import com.example.flowos.Repositories.TeamRepository;
import com.example.flowos.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentService {
    private final DocumentRepository documentRepository;
    private final TeamRepository teamRepository;
    private final OrganisationRepository organisationRepository;
    private final OrganisationMemberRepository organisationMemberRepository;
    private final UserRepository userRepository;
    private final PermissionSecurity permissionSecurity;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<DocumentResponse> list(String email, Long organisationId, Long teamId) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "documents.read");
        if (teamId != null) return documentRepository.findByOrganisationIdAndTeamIdOrderByCreatedAtDesc(organisationId, teamId).stream().map(DocumentResponse::from).toList();
        return documentRepository.findByOrganisationIdOrderByCreatedAtDesc(organisationId).stream().map(DocumentResponse::from).toList();
    }

    @Transactional
    public DocumentResponse create(String email, Long organisationId, DocumentRequest req, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "documents.create");
        User uploader = findUser(email);
        Team team = null;
        if (req.teamId() != null) team = teamRepository.findByIdAndOrganisationId(req.teamId(), organisationId).orElseThrow(() -> new IllegalArgumentException("Team not found"));
        Document d = new Document();
        d.setName(req.name().trim());
        d.setDescription(req.description() != null ? req.description().trim() : null);
        d.setFileUrl(req.fileUrl().trim());
        d.setMimeType(req.mimeType() != null ? req.mimeType().trim() : null);
        d.setSizeBytes(req.sizeBytes());
        d.setTeam(team);
        d.setOrganisation(team != null ? team.getOrganisation() : organisationRepository.findById(organisationId).orElseThrow(() -> new IllegalArgumentException("Organisation not found")));
        d.setUploadedBy(uploader);
        Document saved = documentRepository.save(d);
        auditLogService.logForOrganisation("DOCUMENT_CREATED", "DOCUMENT", saved.getId(), null, email, organisationId, ip);
        return DocumentResponse.from(saved);
    }

    @Transactional
    public DocumentResponse update(String email, Long organisationId, Long docId, DocumentRequest req, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "documents.update");
        Document d = documentRepository.findByIdAndOrganisationId(docId, organisationId).orElseThrow(() -> new IllegalArgumentException("Document not found"));
        if (req.name() != null && !req.name().isBlank()) d.setName(req.name().trim());
        if (req.description() != null) d.setDescription(req.description().trim());
        if (req.fileUrl() != null && !req.fileUrl().isBlank()) d.setFileUrl(req.fileUrl().trim());
        if (req.mimeType() != null) d.setMimeType(req.mimeType().trim());
        if (req.sizeBytes() != null) d.setSizeBytes(req.sizeBytes());
        if (req.teamId() != null) {
            Team team = teamRepository.findByIdAndOrganisationId(req.teamId(), organisationId).orElseThrow(() -> new IllegalArgumentException("Team not found"));
            d.setTeam(team);
        }
        Document saved = documentRepository.save(d);
        auditLogService.logForOrganisation("DOCUMENT_UPDATED", "DOCUMENT", docId, null, email, organisationId, ip);
        return DocumentResponse.from(saved);
    }

    @Transactional
    public void delete(String email, Long organisationId, Long docId, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "documents.delete");
        Document d = documentRepository.findByIdAndOrganisationId(docId, organisationId).orElseThrow(() -> new IllegalArgumentException("Document not found"));
        documentRepository.delete(d);
        auditLogService.logForOrganisation("DOCUMENT_DELETED", "DOCUMENT", docId, null, email, organisationId, ip);
    }

    private User findUser(String email) { return userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found")); }

    private boolean isAdmin(String email, Long orgId) {
        return organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(orgId, email, "ADMIN");
    }
}
