package com.example.flowos.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "module_teams", uniqueConstraints = @UniqueConstraint(columnNames = {"installed_module_id", "team_id"}))
@Getter
@Setter
@NoArgsConstructor
public class ModuleTeam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "installed_module_id", nullable = false)
    private InstalledModule installedModule;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "added_by", nullable = false)
    private User addedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime addedAt;

    @PrePersist
    private void onCreate() {
        addedAt = LocalDateTime.now();
    }
}
