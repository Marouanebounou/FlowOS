CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    assignee_id BIGINT,
    team_id BIGINT NOT NULL,
    organisation_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_tasks_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_organisation FOREIGN KEY (organisation_id) REFERENCES organisations (id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_tasks_creator FOREIGN KEY (created_by) REFERENCES users (id),
    INDEX idx_tasks_org_team (organisation_id, team_id)
);

INSERT INTO permissions (code, description, created_at) VALUES
('tasks.read', 'View tasks', CURRENT_TIMESTAMP(6)),
('tasks.create', 'Create tasks', CURRENT_TIMESTAMP(6)),
('tasks.update', 'Update tasks', CURRENT_TIMESTAMP(6)),
('tasks.delete', 'Delete tasks', CURRENT_TIMESTAMP(6)),
('tasks.assign', 'Assign tasks to users', CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- Grant new permissions to existing ADMIN roles (all tasks perms)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'ADMIN' AND p.code IN ('tasks.read','tasks.create','tasks.update','tasks.delete','tasks.assign');

-- Grant read/create/update to MANAGER, read to EMPLOYEE/MEMBER
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'MANAGER' AND p.code IN ('tasks.read','tasks.create','tasks.update','tasks.assign');
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name IN ('EMPLOYEE','MEMBER') AND p.code = 'tasks.read';
