CREATE TABLE IF NOT EXISTS organisation_invitations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    used BIT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    organisation_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_organisation_invitations_token_hash (token_hash),
    CONSTRAINT fk_organisation_invitations_organisation
        FOREIGN KEY (organisation_id) REFERENCES organisations (id) ON DELETE CASCADE,
    CONSTRAINT fk_organisation_invitations_role
        FOREIGN KEY (role_id) REFERENCES roles (id)
);
