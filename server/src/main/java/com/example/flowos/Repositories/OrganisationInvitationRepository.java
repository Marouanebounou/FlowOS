package com.example.flowos.Repositories;

import com.example.flowos.Models.OrganisationInvitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrganisationInvitationRepository extends JpaRepository<OrganisationInvitation, Long> {
    Optional<OrganisationInvitation> findByTokenHash(String tokenHash);

    Optional<OrganisationInvitation> findByOrganisationIdAndEmailAndUsedFalse(
        Long organisationId,
        String email
    );
}
