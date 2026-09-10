package com.example.flowos.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "organisation_members",
    uniqueConstraints = @UniqueConstraint(columnNames = {"organisation_id", "user_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class OrganisationMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @Column(nullable = false)
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organisation_id", nullable = false)
    private Organisation organisation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @OneToMany(mappedBy = "organisationMember", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TeamMember> teamMemberships = new ArrayList<>();

    @PrePersist
    private void onCreate() {
        joinedAt = LocalDateTime.now();
    }
}
