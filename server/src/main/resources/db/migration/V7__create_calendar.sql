CREATE TABLE IF NOT EXISTS calendar_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    location VARCHAR(255),
    start_at DATETIME(6) NOT NULL,
    end_at DATETIME(6) NOT NULL,
    team_id BIGINT,
    organisation_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_calendar_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL,
    CONSTRAINT fk_calendar_org FOREIGN KEY (organisation_id) REFERENCES organisations (id) ON DELETE CASCADE,
    CONSTRAINT fk_calendar_creator FOREIGN KEY (created_by) REFERENCES users (id),
    INDEX idx_calendar_org_team (organisation_id, team_id),
    INDEX idx_calendar_start (start_at)
);

INSERT INTO permissions (code, description, created_at) VALUES
('calendar.read', 'View calendar events', CURRENT_TIMESTAMP(6)),
('calendar.create', 'Create calendar events', CURRENT_TIMESTAMP(6)),
('calendar.update', 'Update calendar events', CURRENT_TIMESTAMP(6)),
('calendar.delete', 'Delete calendar events', CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'ADMIN' AND p.code IN ('calendar.read','calendar.create','calendar.update','calendar.delete');
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'MANAGER' AND p.code IN ('calendar.read','calendar.create','calendar.update');
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name IN ('EMPLOYEE','MEMBER') AND p.code = 'calendar.read';
