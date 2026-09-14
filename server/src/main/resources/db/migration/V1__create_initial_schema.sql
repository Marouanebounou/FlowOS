CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    active BIT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email)
);

CREATE TABLE IF NOT EXISTS organisations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(255),
    primary_color VARCHAR(255),
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS modules (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    module_key VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    version VARCHAR(255),
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_modules_module_key (module_key)
);

CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    code VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_permissions_code (code)
);

CREATE TABLE IF NOT EXISTS blacklisted_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    token VARCHAR(512) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_blacklisted_tokens_token (token)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    token_hash VARCHAR(128) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    used BIT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_password_reset_tokens_hash (token_hash),
    CONSTRAINT fk_password_reset_tokens_user
        FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(2000) NOT NULL,
    type VARCHAR(255) NOT NULL,
    read BIT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS roles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    created_at DATETIME(6) NOT NULL,
    organisation_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_roles_organisation_name (organisation_id, name),
    CONSTRAINT fk_roles_organisation
        FOREIGN KEY (organisation_id) REFERENCES organisations (id)
);

CREATE TABLE IF NOT EXISTS organisation_members (
    id BIGINT NOT NULL AUTO_INCREMENT,
    joined_at DATETIME(6) NOT NULL,
    active BIT NOT NULL,
    organisation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_organisation_members_organisation_user (organisation_id, user_id),
    CONSTRAINT fk_organisation_members_organisation
        FOREIGN KEY (organisation_id) REFERENCES organisations (id),
    CONSTRAINT fk_organisation_members_user
        FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_organisation_members_role
        FOREIGN KEY (role_id) REFERENCES roles (id)
);

CREATE TABLE IF NOT EXISTS teams (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    organisation_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_teams_organisation_name (organisation_id, name),
    CONSTRAINT fk_teams_organisation
        FOREIGN KEY (organisation_id) REFERENCES organisations (id)
);

CREATE TABLE IF NOT EXISTS team_members (
    id BIGINT NOT NULL AUTO_INCREMENT,
    added_at DATETIME(6) NOT NULL,
    leader BIT NOT NULL,
    team_id BIGINT NOT NULL,
    organisation_member_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_team_members_team_member (team_id, organisation_member_id),
    CONSTRAINT fk_team_members_team
        FOREIGN KEY (team_id) REFERENCES teams (id),
    CONSTRAINT fk_team_members_organisation_member
        FOREIGN KEY (organisation_member_id) REFERENCES organisation_members (id)
);

CREATE TABLE IF NOT EXISTS installed_modules (
    id BIGINT NOT NULL AUTO_INCREMENT,
    enabled BIT NOT NULL,
    installed_at DATETIME(6) NOT NULL,
    organisation_id BIGINT NOT NULL,
    module_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_installed_modules_organisation_module (organisation_id, module_id),
    CONSTRAINT fk_installed_modules_organisation
        FOREIGN KEY (organisation_id) REFERENCES organisations (id),
    CONSTRAINT fk_installed_modules_module
        FOREIGN KEY (module_id) REFERENCES modules (id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES roles (id),
    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id) REFERENCES permissions (id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(255) NOT NULL,
    entity_id BIGINT,
    details VARCHAR(2000),
    ip_address VARCHAR(255),
    created_at DATETIME(6) NOT NULL,
    organisation_id BIGINT,
    user_id BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_audit_logs_organisation
        FOREIGN KEY (organisation_id) REFERENCES organisations (id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);
