package com.example.flowos.Repositories;

import com.example.flowos.Models.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeamId(Long teamId);

    Optional<TeamMember> findByTeamIdAndOrganisationMemberId(Long teamId, Long organisationMemberId);

    void deleteByTeamIdAndOrganisationMemberId(Long teamId, Long organisationMemberId);
}
