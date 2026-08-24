package com.example.flowos.Models;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity(name = "team_member")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class TeamMember {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;
    private Date addedAt;
    private String roleInTeam;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;
    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;
}
