# API Naming Conventions and REST Structure

## Base URL

All backend endpoints start with:

```text
/api/v1
```

Example:

```text
GET /api/v1/organisations
```

`v1` means version one of the API. A later breaking change can use `/api/v2` without breaking existing clients.

## Naming Rules

- Use lowercase endpoint names.
- Use plural nouns for collections.
- Use hyphens between words in URLs.
- Use IDs as path variables.
- Use JSON for request and response bodies.
- Use `camelCase` for JSON fields.
- Do not put verbs in normal CRUD URLs.

Examples:

```text
GET    /api/v1/organisations
GET    /api/v1/organisations/12
POST   /api/v1/organisations
PUT    /api/v1/organisations/12
DELETE /api/v1/organisations/12
```

## Core Resource Endpoints

| Resource | Collection endpoint | Single resource endpoint |
|---|---|---|
| Organisations | `/api/v1/organisations` | `/api/v1/organisations/{organisationId}` |
| Users | `/api/v1/users` | `/api/v1/users/{userId}` |
| Members | `/api/v1/organisations/{organisationId}/members` | `/api/v1/organisations/{organisationId}/members/{memberId}` |
| Teams | `/api/v1/organisations/{organisationId}/teams` | `/api/v1/organisations/{organisationId}/teams/{teamId}` |
| Roles | `/api/v1/organisations/{organisationId}/roles` | `/api/v1/organisations/{organisationId}/roles/{roleId}` |
| Permissions | `/api/v1/permissions` | `/api/v1/permissions/{permissionId}` |
| Modules | `/api/v1/modules` | `/api/v1/modules/{moduleId}` |
| Installed modules | `/api/v1/organisations/{organisationId}/modules` | `/api/v1/organisations/{organisationId}/modules/{moduleId}` |
| Notifications | `/api/v1/users/{userId}/notifications` | `/api/v1/users/{userId}/notifications/{notificationId}` |
| Audit logs | `/api/v1/organisations/{organisationId}/audit-logs` | `/api/v1/organisations/{organisationId}/audit-logs/{auditLogId}` |

## Nested Resources

Use nested endpoints when the child belongs to a parent.

```text
GET  /api/v1/organisations/5/teams
POST /api/v1/organisations/5/teams
GET  /api/v1/organisations/5/teams/8
```

For team members:

```text
GET    /api/v1/organisations/5/teams/8/members
POST   /api/v1/organisations/5/teams/8/members
DELETE /api/v1/organisations/5/teams/8/members/21
```

## Action Endpoints

Use an action endpoint only when the request is not normal create, read, update, or delete.

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
PATCH /api/v1/users/12/activate
PATCH /api/v1/users/12/deactivate
PATCH /api/v1/organisations/5/modules/3/enable
PATCH /api/v1/organisations/5/modules/3/disable
PATCH /api/v1/users/12/notifications/9/read
```

## HTTP Status Codes

| Status | Use |
|---|---|
| `200 OK` | Request succeeded. |
| `201 Created` | A new resource was created. |
| `204 No Content` | A resource was deleted successfully. |
| `400 Bad Request` | Request data is invalid. |
| `401 Unauthorized` | User is not logged in. |
| `403 Forbidden` | User is logged in but lacks permission. |
| `404 Not Found` | Resource does not exist or does not belong to the organization. |
| `409 Conflict` | A duplicate value breaks a unique rule. |

## Response Shape

A successful response can return the requested JSON object directly:

```json
{
  "id": 5,
  "name": "Development"
}
```

A validation error should return a consistent structure:

```json
{
  "message": "Validation failed",
  "errors": {
    "email": "Email is required"
  }
}
```

## Organization Isolation

Every endpoint that contains `{organisationId}` must verify that the current user is a member of that organization before reading or changing data.
