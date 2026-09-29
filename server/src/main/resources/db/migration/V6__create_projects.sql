CREATE TABLE IF NOT EXISTS projects (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    status VARCHAR(50) NOT NULL,
    team_id BIGINT NOT NULL,
    organisation_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_projects_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
    CONSTRAINT fk_projects_organisation FOREIGN KEY (organisation_id) REFERENCES organisations (id) ON DELETE CASCADE,
    CONSTRAINT fk_projects_creator FOREIGN KEY (created_by) REFERENCES users (id),
    INDEX idx_projects_org_team (organisation_id, team_id),
    UNIQUE KEY uk_projects_org_team_name (organisation_id, team_id, name)
);

INSERT INTO permissions (code, description, created_at) VALUES
('projects.read', 'View projects', CURRENT_TIMESTAMP(6)),
('projects.create', 'Create projects', CURRENT_TIMESTAMP(6)),
('projects.update', 'Update projects', CURRENT_TIMESTAMP(6)),
('projects.delete', 'Delete projects', CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'ADMIN' AND p.code IN ('projects.read','projects.create','projects.update','projects.delete');
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'MANAGER' AND p.code IN ('projects.read','projects.create','projects.update');
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name IN ('EMPLOYEE','MEMBER') AND p.code = 'projects.read';
