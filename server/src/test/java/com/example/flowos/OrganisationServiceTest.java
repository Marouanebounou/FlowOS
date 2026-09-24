package com.example.flowos;

import com.example.flowos.Dto.CreateOrganisationRequest;
import com.example.flowos.Dto.OrganisationResponse;
import com.example.flowos.Models.Organisation;
import com.example.flowos.Models.OrganisationMember;
import com.example.flowos.Models.Role;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.OrganisationRepository;
import com.example.flowos.Repositories.UserRepository;
import com.example.flowos.Services.AuditLogService;
import com.example.flowos.Services.OrganisationService;
import com.example.flowos.Services.PermissionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrganisationServiceTest {
    @Mock private OrganisationRepository organisationRepository;
    @Mock private OrganisationMemberRepository organisationMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private PermissionService permissionService;
    @Mock private AuditLogService auditLogService;

    @InjectMocks private OrganisationService organisationService;

    @Test
    void createSuccess() {
        User user = new User();
        user.setId(1L);
        user.setEmail("admin@example.com");
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(user));
        Organisation saved = new Organisation();
        saved.setId(10L);
        saved.setName("Flow");
        when(organisationRepository.save(any(Organisation.class))).thenReturn(saved);
        Role admin = new Role();
        admin.setId(5L);
        admin.setName("ADMIN");
        when(permissionService.createDefaultRoles(any(Organisation.class))).thenReturn(admin);
        when(organisationMemberRepository.save(any(OrganisationMember.class))).thenAnswer(i -> i.getArgument(0));
        CreateOrganisationRequest req = new CreateOrganisationRequest("Flow", null, null);
        OrganisationResponse res = organisationService.create("admin@example.com", req, "127.0.0.1");
        assertEquals(10L, res.id());
        assertEquals("Flow", res.name());
        verify(auditLogService).logForOrganisation(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void createUserNotFound() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());
        CreateOrganisationRequest req = new CreateOrganisationRequest("Flow", null, null);
        assertThrows(IllegalArgumentException.class, () -> organisationService.create("missing@example.com", req, "127.0.0.1"));
    }

    @Test
    void getByIdNotFound() {
        when(organisationRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> organisationService.getById(99L));
    }
}
