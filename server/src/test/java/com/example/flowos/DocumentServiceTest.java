package com.example.flowos;

import com.example.flowos.Dto.DocumentRequest;
import com.example.flowos.Dto.DocumentResponse;
import com.example.flowos.Models.Document;
import com.example.flowos.Models.Organisation;
import com.example.flowos.Models.Team;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.DocumentRepository;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.OrganisationRepository;
import com.example.flowos.Repositories.TeamRepository;
import com.example.flowos.Repositories.UserRepository;
import com.example.flowos.Services.AuditLogService;
import com.example.flowos.Services.DocumentService;
import com.example.flowos.Services.PermissionSecurity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {
    @Mock private DocumentRepository documentRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private OrganisationRepository organisationRepository;
    @Mock private OrganisationMemberRepository organisationMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private PermissionSecurity permissionSecurity;
    @Mock private AuditLogService auditLogService;

    @InjectMocks private DocumentService documentService;

    @Test
    void listDenied() {
        when(organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(10L, "member@example.com", "ADMIN")).thenReturn(false);
        doThrow(new AccessDeniedException("denied")).when(permissionSecurity).requirePermission("member@example.com", 10L, "documents.read");
        assertThrows(AccessDeniedException.class, () -> documentService.list("member@example.com", 10L, null));
    }

    @Test
    void createSuccess() {
        when(organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(10L, "admin@example.com", "ADMIN")).thenReturn(true);
        User u = new User();
        u.setId(1L);
        u.setEmail("admin@example.com");
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(u));
        Organisation org = new Organisation();
        org.setId(10L);
        when(organisationRepository.findById(10L)).thenReturn(Optional.of(org));
        Document saved = new Document();
        saved.setId(40L);
        saved.setName("Spec");
        saved.setFileUrl("https://example.com/spec.pdf");
        saved.setOrganisation(org);
        saved.setUploadedBy(u);
        when(documentRepository.save(any(Document.class))).thenReturn(saved);
        DocumentRequest req = new DocumentRequest("Spec", null, "https://example.com/spec.pdf", null, null, null);
        DocumentResponse res = documentService.create("admin@example.com", 10L, req, "127.0.0.1");
        assertEquals(40L, res.id());
        assertEquals("Spec", res.name());
    }

    @Test
    void deleteNotFound() {
        when(organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(10L, "admin@example.com", "ADMIN")).thenReturn(true);
        when(documentRepository.findByIdAndOrganisationId(99L, 10L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> documentService.delete("admin@example.com", 10L, 99L, "127.0.0.1"));
    }
}
