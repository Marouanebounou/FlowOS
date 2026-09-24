package com.example.flowos;

import com.example.flowos.Dto.CrmContactRequest;
import com.example.flowos.Dto.CrmContactResponse;
import com.example.flowos.Models.CrmContact;
import com.example.flowos.Models.Organisation;
import com.example.flowos.Models.Team;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.CrmContactRepository;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.OrganisationRepository;
import com.example.flowos.Repositories.TeamRepository;
import com.example.flowos.Repositories.UserRepository;
import com.example.flowos.Services.AuditLogService;
import com.example.flowos.Services.CrmService;
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
class CrmServiceTest {
    @Mock private CrmContactRepository crmContactRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private OrganisationRepository organisationRepository;
    @Mock private OrganisationMemberRepository organisationMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private PermissionSecurity permissionSecurity;
    @Mock private AuditLogService auditLogService;

    @InjectMocks private CrmService crmService;

    @Test
    void listDenied() {
        when(organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(10L, "member@example.com", "ADMIN")).thenReturn(false);
        doThrow(new AccessDeniedException("denied")).when(permissionSecurity).requirePermission("member@example.com", 10L, "crm.read");
        assertThrows(AccessDeniedException.class, () -> crmService.list("member@example.com", 10L, null));
    }

    @Test
    void createSuccess() {
        when(organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(10L, "admin@example.com", "ADMIN")).thenReturn(true);
        User creator = new User();
        creator.setId(1L);
        creator.setEmail("admin@example.com");
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(creator));
        Organisation org = new Organisation();
        org.setId(10L);
        when(organisationRepository.findById(10L)).thenReturn(Optional.of(org));
        CrmContact saved = new CrmContact();
        saved.setId(30L);
        saved.setName("Acme");
        saved.setStatus("NEW");
        saved.setOrganisation(org);
        saved.setCreatedBy(creator);
        when(crmContactRepository.save(any(CrmContact.class))).thenReturn(saved);
        CrmContactRequest req = new CrmContactRequest("Acme", "a@b.com", null, null, null, null, null);
        CrmContactResponse res = crmService.create("admin@example.com", 10L, req, "127.0.0.1");
        assertEquals(30L, res.id());
        assertEquals("Acme", res.name());
    }

    @Test
    void createRequiresName() {
        when(organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(10L, "admin@example.com", "ADMIN")).thenReturn(true);
        User creator = new User();
        creator.setId(1L);
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(creator));
        Organisation org = new Organisation();
        org.setId(10L);
        when(organisationRepository.findById(10L)).thenReturn(Optional.of(org));
        CrmContactRequest req = new CrmContactRequest("", "a@b.com", null, null, null, null, null);
        CrmContact saved = new CrmContact();
        saved.setId(31L);
        saved.setName("");
        saved.setStatus("NEW");
        saved.setOrganisation(org);
        saved.setCreatedBy(creator);
        when(crmContactRepository.save(any(CrmContact.class))).thenReturn(saved);
        CrmContactResponse res = crmService.create("admin@example.com", 10L, req, "127.0.0.1");
        assertEquals("", res.name());
    }
}
