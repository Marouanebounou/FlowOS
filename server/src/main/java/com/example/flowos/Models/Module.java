package com.example.flowos.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity(name = "module")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Module {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String name;
    private String description;
    @OneToMany(mappedBy = "module" , cascade = CascadeType.ALL)
    private List<InstalledModule> installedModulesList;
}
