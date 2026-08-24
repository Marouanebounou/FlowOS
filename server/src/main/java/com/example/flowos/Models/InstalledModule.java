package com.example.flowos.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity(name = "installed_module")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class InstalledModule {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;
    private Date installedAt;
    private Boolean isActive;
    @ManyToOne
    @JoinColumn(name = "module_id")
    private Module module;
    @ManyToOne
    @JoinColumn(name = "organisation_id")
    private Organisation organisation;
}
