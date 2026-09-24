package com.example.flowos.Services;

import com.example.flowos.Dto.CrmContactRequest;
import com.example.flowos.Dto.CrmContactResponse;
import com.example.flowos.Models.CrmContact;
import com.example.flowos.Models.Team;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.CrmContactRepository;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.OrganisationRepository;
import com.example.flowos.Repositories.TeamRepository;
import com.example.flowos.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CrmService {
    private final CrmContactRepository crmContactRepository;
    private final TeamRepository teamRepository;
    private final OrganisationRepository organisationRepository;
    private final OrganisationMemberRepository organisationMemberRepository;
    private final UserRepository userRepository;
    private final PermissionSecurity permissionSecurity;
    private final AuditLogService auditLogService;

    private static final Set<String> VALID_STATUS = Set.of("NEW", "CONTACTED", "QUALIFIED", "CUSTOMER");

    @Transactional(readOnly = true)
    public List<CrmContactResponse> list(String email, Long organisationId, Long teamId) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "crm.read");
        if (teamId != null) return crmContactRepository.findByOrganisationIdAndTeamIdOrderByCreatedAtDesc(organisationId, teamId).stream().map(CrmContactResponse::from).toList();
        return crmContactRepository.findByOrganisationIdOrderByCreatedAtDesc(organisationId).stream().map(CrmContactResponse::from).toList();
    }

    @Transactional
    public CrmContactResponse create(String email, Long organisationId, CrmContactRequest req, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "crm.create");
        User creator = findUser(email);
        Team team = null;
        if (req.teamId() != null) team = teamRepository.findByIdAndOrganisationId(req.teamId(), organisationId).orElseThrow(() -> new IllegalArgumentException("Team not found"));
        CrmContact c = new CrmContact();
        c.setName(req.name().trim());
        c.setEmail(req.email() != null ? req.email().trim() : null);
        c.setPhone(req.phone() != null ? req.phone().trim() : null);
        c.setCompany(req.company() != null ? req.company().trim() : null);
        c.setStatus(normalizeStatus(req.status()));
        c.setNotes(req.notes() != null ? req.notes().trim() : null);
        c.setTeam(team);
        c.setOrganisation(team != null ? team.getOrganisation() : organisationRepository.findById(organisationId).orElseThrow(() -> new IllegalArgumentException("Organisation not found")));
        c.setCreatedBy(creator);
        CrmContact saved = crmContactRepository.save(c);
        auditLogService.logForOrganisation("CRM_CREATED", "CRM", saved.getId(), null, email, organisationId, ip);
        return CrmContactResponse.from(saved);
    }

    @Transactional
    public CrmContactResponse update(String email, Long organisationId, Long contactId, CrmContactRequest req, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "crm.update");
        CrmContact c = crmContactRepository.findByIdAndOrganisationId(contactId, organisationId).orElseThrow(() -> new IllegalArgumentException("Contact not found"));
        if (req.name() != null && !req.name().isBlank()) c.setName(req.name().trim());
        if (req.email() != null) c.setEmail(req.email().trim());
        if (req.phone() != null) c.setPhone(req.phone().trim());
        if (req.company() != null) c.setCompany(req.company().trim());
        if (req.status() != null) c.setStatus(normalizeStatus(req.status()));
        if (req.notes() != null) c.setNotes(req.notes().trim());
        if (req.teamId() != null) {
            Team team = teamRepository.findByIdAndOrganisationId(req.teamId(), organisationId).orElseThrow(() -> new IllegalArgumentException("Team not found"));
            c.setTeam(team);
        }
        CrmContact saved = crmContactRepository.save(c);
        auditLogService.logForOrganisation("CRM_UPDATED", "CRM", contactId, null, email, organisationId, ip);
        return CrmContactResponse.from(saved);
    }

    @Transactional
    public void delete(String email, Long organisationId, Long contactId, String ip) {
        if (!isAdmin(email, organisationId)) permissionSecurity.requirePermission(email, organisationId, "crm.delete");
        CrmContact c = crmContactRepository.findByIdAndOrganisationId(contactId, organisationId).orElseThrow(() -> new IllegalArgumentException("Contact not found"));
        crmContactRepository.delete(c);
        auditLogService.logForOrganisation("CRM_DELETED", "CRM", contactId, null, email, organisationId, ip);
    }

    private User findUser(String email) { return userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found")); }

    private String normalizeStatus(String s) {
        if (s == null || s.isBlank()) return "NEW";
        String u = s.trim().toUpperCase();
        if (!VALID_STATUS.contains(u)) throw new IllegalArgumentException("Invalid status: NEW, CONTACTED, QUALIFIED, CUSTOMER");
        return u;
    }

    private boolean isAdmin(String email, Long orgId) {
        return organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(orgId, email, "ADMIN");
    }
}
