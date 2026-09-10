package com.example.flowos.Models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "permissions", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Getter
@Setter
@NoArgsConstructor
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String code;

    private String description;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToMany(mappedBy = "permissions")
    private Set<Role> roles = new HashSet<>();

    @PrePersist
    private void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
