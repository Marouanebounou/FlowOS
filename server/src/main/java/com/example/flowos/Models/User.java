package com.example.flowos.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity(name = "user")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String name;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String password;
    @OneToMany(mappedBy = "user" , cascade = CascadeType.ALL)
    private List<OrganisationMember> organisationMemberList;
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<TeamMember> teamMemberList;
}
