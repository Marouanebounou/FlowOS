package com.example.flowos.Repositories;

import com.example.flowos.Models.OrganisationMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrganisationMemberRepository extends JpaRepository<OrganisationMember, Long> {
    List<OrganisationMember> findByOrganisationId(Long organisationId);

    Optional<OrganisationMember> findByOrganisationIdAndUserId(Long organisationId, Long userId);

    boolean existsByOrganisationIdAndUserEmailAndActiveTrue(Long organisationId, String email);

    boolean existsByOrganisationIdAndUserEmailAndActiveTrueAndRoleNameIgnoreCase(
        Long organisationId,
        String email,
        String roleName
    );

    boolean existsByOrganisationIdAndUserEmailAndActiveTrueAndRolePermissionsCode(
        Long organisationId,
        String email,
        String permissionCode
    );

    @Query("""
        select member
        from OrganisationMember member
        join fetch member.user user
        join fetch member.role role
        where member.organisation.id = :organisationId
          and (:name is null or lower(concat(user.firstName, ' ', user.lastName)) like lower(concat('%', :name, '%')))
          and (:email is null or lower(user.email) like lower(concat('%', :email, '%')))
          and (:active is null or member.active = :active)
        order by user.lastName asc, user.firstName asc
        """)
    List<OrganisationMember> findUsersByOrganisationAndFilters(
        @Param("organisationId") Long organisationId,
        @Param("name") String name,
        @Param("email") String email,
        @Param("active") Boolean active
    );
}
