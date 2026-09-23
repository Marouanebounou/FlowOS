package com.example.flowos.Services;

import com.example.flowos.Dto.InstalledModuleResponse;
import com.example.flowos.Dto.ModuleResponse;
import com.example.flowos.Models.InstalledModule;
import com.example.flowos.Models.Module;
import com.example.flowos.Models.Organisation;
import com.example.flowos.Repositories.InstalledModuleRepository;
import com.example.flowos.Repositories.ModuleRepository;
import com.example.flowos.Repositories.OrganisationMemberRepository;
import com.example.flowos.Repositories.OrganisationRepository;
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
    private final OrganisationRepository organisationRepository;
    private final OrganisationMemberRepository organisationMemberRepository;
    private final PermissionSecurity permissionSecurity;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<ModuleResponse> catalog(String email) {
        // any authenticated user can view catalog
        return moduleRepository.findAll().stream().map(ModuleResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<InstalledModuleResponse> installed(String email, Long organisationId) {
        // any member can see installed modules
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

    private boolean isAdmin(String email, Long organisationId) {
        return organisationMemberRepository.existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(organisationId, email, "ADMIN");
    }

    private Organisation findOrganisation(Long id) {
        return organisationRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Organisation not found"));
    }
}
