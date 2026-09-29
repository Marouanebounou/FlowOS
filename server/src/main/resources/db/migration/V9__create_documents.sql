CREATE TABLE IF NOT EXISTS documents (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    file_url VARCHAR(1000) NOT NULL,
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    team_id BIGINT,
    organisation_id BIGINT NOT NULL,
    uploaded_by BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_docs_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE SET NULL,
    CONSTRAINT fk_docs_org FOREIGN KEY (organisation_id) REFERENCES organisations (id) ON DELETE CASCADE,
    CONSTRAINT fk_docs_uploader FOREIGN KEY (uploaded_by) REFERENCES users (id),
    INDEX idx_docs_org_team (organisation_id, team_id)
);

INSERT INTO permissions (code, description, created_at) VALUES
('documents.read', 'View documents', CURRENT_TIMESTAMP(6)),
('documents.create', 'Upload documents', CURRENT_TIMESTAMP(6)),
('documents.update', 'Update documents', CURRENT_TIMESTAMP(6)),
('documents.delete', 'Delete documents', CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'ADMIN' AND p.code IN ('documents.read','documents.create','documents.update','documents.delete');
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'MANAGER' AND p.code IN ('documents.read','documents.create','documents.update');
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name IN ('EMPLOYEE','MEMBER') AND p.code = 'documents.read';
