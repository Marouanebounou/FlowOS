# Core Entity Relationships and Constraints

This document explains how the first FlowOS entities connect to each other.

## Main Relationships

| Parent | Relationship | Child | Meaning |
|---|---|---|---|
| Organisation | one-to-many | OrganisationMember | One organisation has many members. |
| User | one-to-many | OrganisationMember | One user can join more than one organisation. |
| Role | one-to-many | OrganisationMember | Each organisation membership has one role. |
| Organisation | one-to-many | Team | One organisation can create many teams. |
| Team | one-to-many | TeamMember | One team has many members. |
| OrganisationMember | one-to-many | TeamMember | A team member must already be a member of that organisation. |
| Role | many-to-many | Permission | A role can have many permissions and a permission can belong to many roles. |
| Organisation | one-to-many | InstalledModule | An organisation can install many modules. |
| Module | one-to-many | InstalledModule | A module can be installed by many organisations. |
| User | one-to-many | Notification | A user can receive many notifications. |
| Organisation | one-to-many | AuditLog | An organisation has many audit logs. |
| User | one-to-many | AuditLog | A user can create many audit logs. |

## Important Constraints

### Organisation

- `name` is required.
- `createdAt` is set automatically when the organisation is created.

### User

- `firstName`, `lastName`, `email`, and `password` are required.
- `email` must be unique, so one login cannot be registered twice.
- `active` is `true` by default.
- `createdAt` is set automatically.

### OrganisationMember

- `organisation_id`, `user_id`, and `role_id` are required.
- The same user can only join the same organisation once.
- Database rule: `(organisation_id, user_id)` must be unique.
- `active` is `true` by default.
- `joinedAt` is set automatically.

### Team

- `organisation_id` and `name` are required.
- Two teams in the same organisation cannot have the same name.
- Database rule: `(organisation_id, name)` must be unique.

### TeamMember

- `team_id` and `organisation_member_id` are required.
- A member can only be added to the same team once.
- Database rule: `(team_id, organisation_member_id)` must be unique.
- `leader` is `false` by default.

### Role

- `organisation_id` and `name` are required.
- Two roles in the same organisation cannot have the same name.
- Database rule: `(organisation_id, name)` must be unique.

### Permission

- `code` is required and unique across the platform.
- Use clear permission codes such as `team.create`, `team.read`, and `user.invite`.

### RolePermission

- This is the join table created automatically by JPA: `role_permissions`.
- It connects roles and permissions.
- The same permission should be added to a role only once.

### Module

- `name` and `key` are required.
- `key` is unique across the platform.
- Use simple stable keys such as `projects`, `documents`, and `calendar`.

### InstalledModule

- `organisation_id` and `module_id` are required.
- An organisation can install a module only once.
- Database rule: `(organisation_id, module_id)` must be unique.
- `enabled` is `true` by default.

### Notification

- `user_id`, `title`, `message`, and `type` are required.
- `read` is `false` by default.

### AuditLog

- `organisation_id`, `action`, and `entityType` are required.
- `user_id` is optional because a system action may not have a user.
- Examples: `USER_LOGIN`, `TEAM_CREATED`, and `MODULE_INSTALLED`.

## Isolation Rule

Every organisation-specific request must use the current organisation ID.

For example, when fetching teams, the query must only return teams where `organisation_id` is the current organisation. This prevents one organisation from seeing another organisation's data.
