# FlowOS

All-in-one business workspace: one place for an organization to manage its members, teams, roles, CRM contacts, calendar and documents.

## Features

- JWT authentication: register, login, logout, forgot / reset / change password
- Multi-organization: users can belong to several organizations and switch between them
- Organization-scoped RBAC: roles and permissions per organization
- Members, teams and email invitations
- Modules: CRM contacts, calendar events, documents
- API contract in `FRONTEND_HANDOFF.md`, architecture notes in `server/ARCHITECTURE.md`

## Tech stack

- **Backend (`server/`):** Java 21, Spring Boot 4, Spring Security, JWT, Spring Data JPA, MySQL, Flyway, Spring Mail
- **Frontend (`Client/`):** React, Vite, served with Nginx
- **Infra:** Docker and Docker Compose

## Run with Docker

```bash
docker compose up --build
```

Set the database variables listed in `server/.env.example` first.

## API examples

All endpoints are under `/api/v1`:

| Method | Path |
| --- | --- |
| `POST` | `/api/v1/auth/login` |
| `GET` | `/api/v1/organisations/{organisationId}/me/permissions` |
| `POST` | `/api/v1/invitations/{token}/accept` |
| `GET` | `/api/v1/organisations/{organisationId}/crm` |

Design: [Figma](https://www.figma.com/design/3vtizhWd7pG7vgqd7xmJJT/FlowOS?node-id=5-2&t=xq8hGXvr7iGtIRNN-1)

## Author

**Marouane Bounou** · [LinkedIn](https://www.linkedin.com/in/marouane-bounou/) · [Portfolio](https://marouanebounou.online)
