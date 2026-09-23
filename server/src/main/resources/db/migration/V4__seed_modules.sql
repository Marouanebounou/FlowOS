INSERT INTO modules (name, module_key, description, version, created_at) VALUES
('Tasks', 'tasks', 'Manage tasks and to-dos for teams', '1.0.0', CURRENT_TIMESTAMP(6)),
('Projects', 'projects', 'Organize work into projects and track progress', '1.0.0', CURRENT_TIMESTAMP(6)),
('Calendar', 'calendar', 'Shared calendars and scheduling', '1.0.0', CURRENT_TIMESTAMP(6)),
('CRM', 'crm', 'Customer relationship management', '1.0.0', CURRENT_TIMESTAMP(6)),
('Documents', 'documents', 'Collaborate on documents', '1.0.0', CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE name=VALUES(name);
