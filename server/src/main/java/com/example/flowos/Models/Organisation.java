package com.example.flowos.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;
import java.util.List;

@AllArgsConstructor
@Getter
@Setter
@NoArgsConstructor
@Entity(name = "organisation")
public class Organisation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String name;
    private String logoUrl;
    private Date createdAt;
    @OneToMany(mappedBy = "organisation" , cascade = CascadeType.ALL)
    private List<OrganisationMember> organisationsMembers;
    @OneToMany(mappedBy = "organisation" , cascade = CascadeType.ALL)
    private List<InstalledModule> installedModuleList;
}
