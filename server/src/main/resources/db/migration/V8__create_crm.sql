CREATE TABLE IF NOT EXISTS crm_contacts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(255),
    company VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    notes VARCHAR(2000),
    team_id BIGINT,
    organisation_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_crm_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL,
    CONSTRAINT fk_crm_org FOREIGN KEY (organisation_id) REFERENCES organisations (id) ON DELETE CASCADE,
    CONSTRAINT fk_crm_creator FOREIGN KEY (created_by) REFERENCES users (id),
    INDEX idx_crm_org_team (organisation_id, team_id),
    INDEX idx_crm_status (status)
);

INSERT INTO permissions (code, description, created_at) VALUES
('crm.read', 'View CRM contacts', CURRENT_TIMESTAMP(6)),
('crm.create', 'Create CRM contacts', CURRENT_TIMESTAMP(6)),
('crm.update', 'Update CRM contacts', CURRENT_TIMESTAMP(6)),
('crm.delete', 'Delete CRM contacts', CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'ADMIN' AND p.code IN ('crm.read','crm.create','crm.update','crm.delete');
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'MANAGER' AND p.code IN ('crm.read','crm.create','crm.update');
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name IN ('EMPLOYEE','MEMBER') AND p.code = 'crm.read';
