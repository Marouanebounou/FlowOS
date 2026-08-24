package com.example.flowos.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity(name = "organisation_member")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class OrganisationMember {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;
    private Date joinedAt;
    private String status;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    @ManyToOne
    @JoinColumn(name = "organisation_id")
    private Organisation organisation;
    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;
}
