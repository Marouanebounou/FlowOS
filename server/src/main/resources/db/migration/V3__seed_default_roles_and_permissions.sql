INSERT IGNORE INTO permissions (code, description, created_at)
VALUES
    ('team.read', 'View teams and team members', CURRENT_TIMESTAMP(6)),
    ('team.create', 'Create teams', CURRENT_TIMESTAMP(6)),
    ('team.update', 'Update teams', CURRENT_TIMESTAMP(6)),
    ('team.delete', 'Delete teams', CURRENT_TIMESTAMP(6)),
    ('team.member.add', 'Add users to teams', CURRENT_TIMESTAMP(6)),
    ('team.member.remove', 'Remove users from teams', CURRENT_TIMESTAMP(6)),
    ('team.leader.assign', 'Assign team leaders', CURRENT_TIMESTAMP(6)),
    ('role.read', 'View roles', CURRENT_TIMESTAMP(6)),
    ('role.create', 'Create roles', CURRENT_TIMESTAMP(6)),
    ('role.update', 'Update roles', CURRENT_TIMESTAMP(6)),
    ('role.delete', 'Delete roles', CURRENT_TIMESTAMP(6)),
    ('role.permission.assign', 'Assign permissions to roles', CURRENT_TIMESTAMP(6)),
    ('permission.read', 'View permissions', CURRENT_TIMESTAMP(6)),
    ('permission.create', 'Create permissions', CURRENT_TIMESTAMP(6)),
    ('permission.update', 'Update permissions', CURRENT_TIMESTAMP(6)),
    ('permission.delete', 'Delete permissions', CURRENT_TIMESTAMP(6));

INSERT INTO roles (name, description, created_at, organisation_id)
SELECT 'ADMIN', 'Organisation administrator', CURRENT_TIMESTAMP(6), organisation.id
FROM organisations organisation
WHERE NOT EXISTS (
    SELECT 1 FROM roles role
    WHERE role.organisation_id = organisation.id AND LOWER(role.name) = 'admin'
);

INSERT INTO roles (name, description, created_at, organisation_id)
SELECT 'MANAGER', 'Team manager', CURRENT_TIMESTAMP(6), organisation.id
FROM organisations organisation
WHERE NOT EXISTS (
    SELECT 1 FROM roles role
    WHERE role.organisation_id = organisation.id AND LOWER(role.name) = 'manager'
);

INSERT INTO roles (name, description, created_at, organisation_id)
SELECT 'EMPLOYEE', 'Organisation employee', CURRENT_TIMESTAMP(6), organisation.id
FROM organisations organisation
WHERE NOT EXISTS (
    SELECT 1 FROM roles role
    WHERE role.organisation_id = organisation.id AND LOWER(role.name) = 'employee'
);

INSERT INTO roles (name, description, created_at, organisation_id)
SELECT 'MEMBER', 'Organisation member', CURRENT_TIMESTAMP(6), organisation.id
FROM organisations organisation
WHERE NOT EXISTS (
    SELECT 1 FROM roles role
    WHERE role.organisation_id = organisation.id AND LOWER(role.name) = 'member'
);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
JOIN permissions permission
WHERE LOWER(role.name) = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
JOIN permissions permission
WHERE LOWER(role.name) = 'manager'
  AND permission.code IN (
      'team.read', 'team.create', 'team.update',
      'team.member.add', 'team.member.remove', 'team.leader.assign'
  );

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
JOIN permissions permission
WHERE LOWER(role.name) IN ('employee', 'member')
  AND permission.code = 'team.read';
