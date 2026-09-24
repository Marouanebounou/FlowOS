package com.example.flowos.Services;

import com.example.flowos.Dto.InstalledModuleResponse;
import com.example.flowos.Dto.ModuleResponse;
import com.example.flowos.Models.InstalledModule;
import com.example.flowos.Models.Module;
import com.example.flowos.Models.Organisation;
import com.example.flowos.Dto.ModuleTeamResponse;
import com.example.flowos.Models.ModuleTeam;
import com.example.flowos.Models.Team;
import com.example.flowos.Models.User;
import com.example.flowos.Repositories.InstalledModuleRepository;
import com.example.flowos.Repositories.ModuleRepository;
import com.example.flowos.Repositories.ModuleTeamRepository;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.OrganisationRepository;
import com.example.flowos.Repositories.TeamRepository;
import com.example.flowos.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ModuleService {
    private final ModuleRepository moduleRepository;
    private final InstalledModuleRepository installedModuleRepository;
    private final ModuleTeamRepository moduleTeamRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final OrganisationRepository organisationRepository;
    private final OrganisationMemberRepository organisationMemberRepository;
    private final PermissionSecurity permissionSecurity;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<ModuleResponse> catalog(String email) {

        return moduleRepository.findAll().stream().map(ModuleResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<InstalledModuleResponse> installed(String email, Long organisationId) {

        if (!organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrue(organisationId, email)) {
            throw new AccessDeniedException("Not a member of this organisation");
        }
        findOrganisation(organisationId);
        return installedModuleRepository.findByOrganisationId(organisationId).stream().map(InstalledModuleResponse::from).toList();
    }

    @Transactional
    public InstalledModuleResponse install(String email, Long organisationId, String moduleKey, String ipAddress) {
        if (!isAdmin(email, organisationId)) {
            throw new AccessDeniedException("Admin required");
        }
        Organisation org = findOrganisation(organisationId);
        Module module = moduleRepository.findByKey(moduleKey)
            .orElseThrow(() -> new IllegalArgumentException("Module not found: " + moduleKey));

        installedModuleRepository.findByOrganisationIdAndModuleId(organisationId, module.getId())
            .ifPresent(im -> { throw new IllegalArgumentException("Module already installed"); });

        InstalledModule im = new InstalledModule();
        im.setOrganisation(org);
        im.setModule(module);
        im.setEnabled(true);
        InstalledModule saved = installedModuleRepository.save(im);

        auditLogService.logForOrganisation("MODULE_INSTALLED", "MODULE", saved.getId(), "key=" + moduleKey, email, organisationId, ipAddress);
        return InstalledModuleResponse.from(saved);
    }

    @Transactional
    public void uninstall(String email, Long organisationId, String moduleKey, String ipAddress) {
        if (!isAdmin(email, organisationId)) throw new AccessDeniedException("Admin required");
        Module module = moduleRepository.findByKey(moduleKey).orElseThrow(() -> new IllegalArgumentException("Module not found"));
        InstalledModule im = installedModuleRepository.findByOrganisationIdAndModuleId(organisationId, module.getId())
            .orElseThrow(() -> new IllegalArgumentException("Module not installed"));
        installedModuleRepository.delete(im);
        auditLogService.logForOrganisation("MODULE_UNINSTALLED", "MODULE", im.getId(), "key=" + moduleKey, email, organisationId, ipAddress);
    }

    @Transactional
    public InstalledModuleResponse setEnabled(String email, Long organisationId, String moduleKey, boolean enabled, String ipAddress) {
        if (!isAdmin(email, organisationId)) throw new AccessDeniedException("Admin required");
        Module module = moduleRepository.findByKey(moduleKey).orElseThrow(() -> new IllegalArgumentException("Module not found"));
        InstalledModule im = installedModuleRepository.findByOrganisationIdAndModuleId(organisationId, module.getId())
            .orElseThrow(() -> new IllegalArgumentException("Module not installed"));
        im.setEnabled(enabled);
        InstalledModule saved = installedModuleRepository.save(im);
        auditLogService.logForOrganisation(enabled ? "MODULE_ENABLED" : "MODULE_DISABLED", "MODULE", saved.getId(), "key=" + moduleKey, email, organisationId, ipAddress);
        return InstalledModuleResponse.from(saved);
    }

    @Transactional
    public InstalledModuleResponse setResponsable(String email, Long organisationId, String moduleKey, Long userId, String ipAddress) {
        if (!isAdmin(email, organisationId)) throw new AccessDeniedException("Admin required");
        Module module = moduleRepository.findByKey(moduleKey).orElseThrow(() -> new IllegalArgumentException("Module not found"));
        InstalledModule im = installedModuleRepository.findByOrganisationIdAndModuleId(organisationId, module.getId())
            .orElseThrow(() -> new IllegalArgumentException("Module not installed"));
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (organisationMemberRepository.findByOrganisationIdAndUserId(organisationId, userId).isEmpty())
            throw new IllegalArgumentException("User is not a member of this organisation");
        im.setResponsable(user);
        InstalledModule saved = installedModuleRepository.save(im);
        auditLogService.logForOrganisation("MODULE_RESPONSABLE_SET", "MODULE", saved.getId(), "user=" + userId, email, organisationId, ipAddress);
        return InstalledModuleResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ModuleTeamResponse> listModuleTeams(String email, Long organisationId, String moduleKey) {
        if (!organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrue(organisationId, email))
            throw new AccessDeniedException("Not a member");
        Module module = moduleRepository.findByKey(moduleKey).orElseThrow(() -> new IllegalArgumentException("Module not found"));
        InstalledModule im = installedModuleRepository.findByOrganisationIdAndModuleId(organisationId, module.getId())
            .orElseThrow(() -> new IllegalArgumentException("Module not installed"));
        return moduleTeamRepository.findByInstalledModuleId(im.getId()).stream().map(ModuleTeamResponse::from).toList();
    }

    @Transactional
    public ModuleTeamResponse addModuleTeam(String email, Long organisationId, String moduleKey, Long teamId, String ipAddress) {
        if (!isAdminOrResponsable(email, organisationId, moduleKey)) throw new AccessDeniedException("Admin or responsable required");
        Module module = moduleRepository.findByKey(moduleKey).orElseThrow(() -> new IllegalArgumentException("Module not found"));
        InstalledModule im = installedModuleRepository.findByOrganisationIdAndModuleId(organisationId, module.getId())
            .orElseThrow(() -> new IllegalArgumentException("Module not installed"));
        Team team = teamRepository.findByIdAndOrganisationId(teamId, organisationId).orElseThrow(() -> new IllegalArgumentException("Team not found"));
        moduleTeamRepository.findByInstalledModuleIdAndTeamId(im.getId(), teamId).ifPresent(mt -> { throw new IllegalArgumentException("Team already assigned to this module"); });
        User actor = userRepository.findByEmail(email).orElseThrow();
        ModuleTeam mt = new ModuleTeam();
        mt.setInstalledModule(im);
        mt.setTeam(team);
        mt.setAddedBy(actor);
        ModuleTeam saved = moduleTeamRepository.save(mt);
        auditLogService.logForOrganisation("MODULE_TEAM_ADDED", "MODULE", im.getId(), "team=" + teamId, email, organisationId, ipAddress);
        return ModuleTeamResponse.from(saved);
    }

    @Transactional
    public void removeModuleTeam(String email, Long organisationId, String moduleKey, Long teamId, String ipAddress) {
        if (!isAdminOrResponsable(email, organisationId, moduleKey)) throw new AccessDeniedException("Admin or responsable required");
        Module module = moduleRepository.findByKey(moduleKey).orElseThrow(() -> new IllegalArgumentException("Module not found"));
        InstalledModule im = installedModuleRepository.findByOrganisationIdAndModuleId(organisationId, module.getId())
            .orElseThrow(() -> new IllegalArgumentException("Module not installed"));
        ModuleTeam mt = moduleTeamRepository.findByInstalledModuleIdAndTeamId(im.getId(), teamId)
            .orElseThrow(() -> new IllegalArgumentException("Team not assigned to this module"));
        moduleTeamRepository.delete(mt);
        auditLogService.logForOrganisation("MODULE_TEAM_REMOVED", "MODULE", im.getId(), "team=" + teamId, email, organisationId, ipAddress);
    }

    private boolean isAdmin(String email, Long organisationId) {
        return organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(organisationId, email, "ADMIN");
    }

    private boolean isAdminOrResponsable(String email, Long organisationId, String moduleKey) {
        if (isAdmin(email, organisationId)) return true;
        Module module = moduleRepository.findByKey(moduleKey).orElse(null);
        if (module == null) return false;
        InstalledModule im = installedModuleRepository.findByOrganisationIdAndModuleId(organisationId, module.getId()).orElse(null);
        return im != null && im.getResponsable() != null && im.getResponsable().getEmail().equalsIgnoreCase(email);
    }

    private Organisation findOrganisation(Long id) {
        return organisationRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Organisation not found"));
    }
}
