package com.example.flowos.Repositories;

import com.example.flowos.Models.OrganisationMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrganisationMemberRepository extends JpaRepository<OrganisationMember, Long> {
    List<OrganisationMember> findByOrganisationId(Long organisationId);

    Optional<OrganisationMember> findByOrganisationIdAndUserId(Long organisationId, Long userId);
}
