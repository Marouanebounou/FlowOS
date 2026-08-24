package com.example.flowos.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity(name = "team")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;
    private String name;
    @OneToMany(mappedBy = "team" , cascade = CascadeType.ALL)
    private List<TeamMember> teamMemberList;
}
