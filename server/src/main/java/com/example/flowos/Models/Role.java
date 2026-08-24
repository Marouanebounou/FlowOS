package com.example.flowos.Models;

import com.example.flowos.Enums.Permission;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;
@Entity(name = "role")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;
    private String name;
    @ElementCollection
    @Enumerated(EnumType.STRING)
    private List<Permission> permissions;
}
