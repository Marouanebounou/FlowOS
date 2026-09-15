package com.example.flowos.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "team_members",
    uniqueConstraints = @UniqueConstraint(columnNames = {"team_id", "organisation_member_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class TeamMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private LocalDateTime addedAt;

    @Column(nullable = false)
    private Boolean leader = false;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organisation_member_id", nullable = false)
    private OrganisationMember organisationMember;

    @PrePersist
    private void onCreate() {
        addedAt = LocalDateTime.now();
    }
}
