ALTER TABLE installed_modules ADD COLUMN responsable_id BIGINT NULL AFTER module_id,
ADD CONSTRAINT fk_installed_responsable FOREIGN KEY (responsable_id) REFERENCES users (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS module_teams (
    id BIGINT NOT NULL AUTO_INCREMENT,
    installed_module_id BIGINT NOT NULL,
    team_id BIGINT NOT NULL,
    added_by BIGINT NOT NULL,
    added_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_module_team (installed_module_id, team_id),
    CONSTRAINT fk_module_teams_module FOREIGN KEY (installed_module_id) REFERENCES installed_modules (id) ON DELETE CASCADE,
    CONSTRAINT fk_module_teams_team FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
    CONSTRAINT fk_module_teams_user FOREIGN KEY (added_by) REFERENCES users (id)
);
