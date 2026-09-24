# FlowOS Frontend Handoff

**Backend base path:** `/api/v1`  
**Document scope:** Current backend contract for frontend implementation  
**Generated:** 2026-09-15  
**Backend stack:** Spring Boot, MySQL, Flyway, stateless JWT, organization-scoped RBAC

This document describes the API that currently exists in the repository. The backend is the source of truth for authorization. Frontend permission checks are for navigation and user experience only; every protected request must still be sent and handled as if the backend may reject it.

## 1. Quick Start

### Base URL

Use an environment variable rather than hard-coding the host:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

Example request URL:

```text
POST http://localhost:8080/api/v1/auth/login
```

### Standard headers

For JSON requests:

```http
Content-Type: application/json
Accept: application/json
```

For authenticated requests, send the JWT returned by login, registration, or invitation acceptance:

```http
Authorization: Bearer <jwt-token>
```

Do not send an `Authorization` header for public endpoints.

### Response conventions

- `200 OK`: Successful read or update with a response body.
- `201 Created`: A resource was created.
- `202 Accepted`: An invitation was accepted for processing; the current endpoint has no response body.
- `204 No Content`: Successful action with no response body.
- `400 Bad Request`: Validation failure or business rule failure.
- `401 Unauthorized`: Missing, expired, invalid, or blacklisted JWT.
- `403 Forbidden`: The authenticated user is active but lacks organization membership or the required permission.
- `404 Not Found`: The resource or organization-scoped resource does not exist.

Successful list endpoints return JSON arrays. There is currently no server-side pagination.

### Error shape

Application errors normally use this shape:

```json
{
  "message": "Validation failed",
  "errors": {
    "email": "Email must be valid"
  }
}
```

`errors` can be empty:

```json
{
  "message": "You do not have permission to perform this action",
  "errors": {}
}
```

The security filter may reject an unauthenticated request before the application exception handler runs. Treat every `401` as a session failure and every `403` as an authorization failure.

## 2. Shared Data Contracts

### AuthResponse

Returned by registration, login, and invitation acceptance.

```json
{
  "userId": 42,
  "firstName": "Amina",
  "lastName": "Benali",
  "email": "amina@example.com",
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

| Field | Type | Notes |
|---|---|---|
| `userId` | number | User identifier. |
| `firstName` | string | User first name. |
| `lastName` | string | User last name. |
| `email` | string | Normalized login email. |
| `token` | string | JWT bearer token. |

### UserProfileResponse

```json
{
  "id": 42,
  "firstName": "Amina",
  "lastName": "Benali",
  "email": "amina@example.com",
  "phoneNumber": "+212 600 000 000",
  "active": true,
  "createdAt": "2026-09-15T10:30:00"
}
```

### OrganisationResponse

```json
{
  "id": 7,
  "name": "Flow Studio",
  "logoUrl": "https://cdn.example.com/flow-studio.png",
  "primaryColor": "#1E6F5C",
  "createdAt": "2026-09-15T10:35:00"
}
```

`logoUrl` and `primaryColor` may be `null`.

### OrganisationUserResponse

```json
{
  "userId": 42,
  "firstName": "Amina",
  "lastName": "Benali",
  "email": "amina@example.com",
  "phoneNumber": "+212 600 000 000",
  "userActive": true,
  "membershipActive": true,
  "roleId": 11,
  "roleName": "MANAGER",
  "joinedAt": "2026-09-15T10:40:00"
}
```

`userActive` is the global account state. `membershipActive` is the membership state in the selected organization.

### TeamResponse

```json
{
  "id": 15,
  "organisationId": 7,
  "name": "Product",
  "memberCount": 4,
  "createdAt": "2026-09-15T11:00:00"
}
```

### TeamMemberResponse

```json
{
  "userId": 42,
  "firstName": "Amina",
  "lastName": "Benali",
  "email": "amina@example.com",
  "leader": true,
  "addedAt": "2026-09-15T11:05:00"
}
```

### PermissionResponse

```json
{
  "id": 3,
  "code": "team.create",
  "description": "Create teams"
}
```

Permission codes are lowercase dot-separated words. Examples:

- `team.read`
- `team.create`
- `team.member.add`
- `role.permission.assign`
- `permission.update`

Permission definitions are currently global, while roles are organization-scoped. The permission list therefore returns the global catalog, not only definitions created by the selected organization.

### RoleResponse

```json
{
  "id": 11,
  "organisationId": 7,
  "name": "MANAGER",
  "description": "Team manager",
  "permissions": [
    {
      "id": 1,
      "code": "team.read",
      "description": "View teams and team members"
    }
  ],
  "memberCount": 3,
  "createdAt": "2026-09-15T10:36:00"
}
```

## 3. Authentication Endpoints

### Register

`POST /api/v1/auth/register`  
**Auth:** Public  
**Response:** `201 AuthResponse`

Request:

```json
{
  "firstName": "Amina",
  "lastName": "Benali",
  "email": "amina@example.com",
  "phoneNumber": "+212 600 000 000",
  "password": "StrongPass123!"
}
```

Rules:

- `firstName` and `lastName` are required and max 255 characters.
- `email` is required, valid, and globally unique.
- `phoneNumber` is optional and accepts digits, `+`, parentheses, spaces, and hyphens.
- Password must contain at least 8 characters.
- The response includes a JWT, so the user can enter the authenticated app immediately.

### Login

`POST /api/v1/auth/login`  
**Auth:** Public  
**Response:** `200 AuthResponse`

Request:

```json
{
  "email": "amina@example.com",
  "password": "StrongPass123!"
}
```

Use the same generic UI message for an unknown email, wrong password, or inactive account. Do not reveal which credential was wrong.

### Logout

`POST /api/v1/auth/logout`  
**Auth:** Required  
**Response:** `204 No Content`

No body is required. The backend blacklists the current JWT. The frontend must clear its in-memory auth state even if the request fails because the token is already expired.

### Forgot password

`POST /api/v1/auth/forgot-password`  
**Auth:** Public  
**Response:** `204 No Content`

Request:

```json
{
  "email": "amina@example.com"
}
```

Always show the same success message, whether the email exists or not. The reset token expires after 15 minutes and is single-use. In development, email may be disabled and the token may be written to the backend console.

### Reset password

`POST /api/v1/auth/reset-password`  
**Auth:** Public  
**Response:** `204 No Content`

Request:

```json
{
  "token": "raw-reset-token-from-email",
  "newPassword": "NewStrongPass123!"
}
```

The reset page should read the token from the link, keep it only in transient page state, and never send it to analytics or logs.

### Change password

`POST /api/v1/auth/change-password`  
**Auth:** Required  
**Response:** `204 No Content`

Request:

```json
{
  "currentPassword": "OldStrongPass123!",
  "newPassword": "NewStrongPass123!"
}
```

After success, keep the current session only if the backend contract continues to support it. If the backend later revokes all previous tokens after a password change, handle the resulting `401` by returning to login.

## 4. User and Profile Endpoints

### Get my profile

`GET /api/v1/users/me`  
**Auth:** Required  
**Response:** `200 UserProfileResponse`

### Update my profile

`PATCH /api/v1/users/me`  
**Auth:** Required  
**Response:** `200 UserProfileResponse`

Request:

```json
{
  "firstName": "Amina",
  "lastName": "Benali",
  "phoneNumber": "+212 600 000 000"
}
```

All fields are optional. If provided, first and last names cannot be blank. The email is not changed by this endpoint.

### Update an organization member profile

`PATCH /api/v1/users/organisations/{organisationId}/users/{userId}`  
**Auth:** Required  
**Authorization:** Organization admin  
**Response:** `200 UserProfileResponse`

Request:

```json
{
  "firstName": "Amina",
  "lastName": "Benali",
  "phoneNumber": "+212 600 000 000"
}
```

The selected user must belong to the selected organization. Never allow the frontend organization selector to change the organization ID silently while this form is open.

## 5. Organization Endpoints

### Create an organization

`POST /api/v1/organisations`  
**Auth:** Required  
**Response:** `201 OrganisationResponse`

Request:

```json
{
  "name": "Flow Studio",
  "logoUrl": "https://cdn.example.com/flow-studio.png",
  "primaryColor": "#1E6F5C"
}
```

The authenticated user becomes an `ADMIN`. The backend creates default `ADMIN`, `MANAGER`, `EMPLOYEE`, and `MEMBER` roles and seeds the default permission catalog.

### Get organization details

`GET /api/v1/organisations/{organisationId}`  
**Auth:** Required  
**Authorization:** Active organization member  
**Response:** `200 OrganisationResponse`

### Update organization details

`PUT /api/v1/organisations/{organisationId}`  
**Auth:** Required  
**Authorization:** Organization admin  
**Response:** `200 OrganisationResponse`

Request:

```json
{
  "name": "Flow Studio Europe",
  "logoUrl": "https://cdn.example.com/flow-studio-eu.png"
}
```

The name is required. The primary color is managed by the settings endpoint.

### Update organization settings and branding

`PATCH /api/v1/organisations/{organisationId}/settings`  
**Auth:** Required  
**Authorization:** Organization admin  
**Response:** `200 OrganisationResponse`

Request examples:

```json
{
  "name": "Flow Studio",
  "logoUrl": "https://cdn.example.com/flow-studio.png",
  "primaryColor": "#1E6F5C"
}
```

Send only fields that should change. An empty string can be used to clear optional branding values where accepted by the backend. `primaryColor` must be a six-digit hexadecimal color.

### Delete organization

`DELETE /api/v1/organisations/{organisationId}`  
**Auth:** Required  
**Authorization:** Organization admin  
**Response:** `204 No Content`

This is a permanent hard delete. The confirmation dialog must name the organization and require an explicit confirmation phrase. After success, remove the organization from the client-side organization list and select another organization or show the onboarding page.

### List organization users

`GET /api/v1/organisations/{organisationId}/users`  
**Auth:** Required  
**Authorization:** Organization admin  
**Response:** `200 OrganisationUserResponse[]`

Optional query parameters:

```text
?name=amina&email=example.com&active=true
```

Parameters:

| Parameter | Type | Behavior |
|---|---|---|
| `name` | string | Case-insensitive partial match against first and last name. |
| `email` | string | Case-insensitive partial match. |
| `active` | boolean | Filters organization membership status. |

There is no server-side pagination. Add client-side filtering only as a temporary usability measure; do not assume it prevents large responses.

### Deactivate a user

`PATCH /api/v1/organisations/{organisationId}/users/{userId}/deactivate`  
**Auth:** Required  
**Authorization:** Organization admin  
**Response:** `200 OrganisationUserResponse`

No body. The current backend also sets the global `user.active` flag to false. This means deactivation can prevent that user from logging in to every organization, not only the selected organization. Show a strong warning in the UI.

The admin cannot deactivate their own account.

### Reactivate a user

`PATCH /api/v1/organisations/{organisationId}/users/{userId}/reactivate`  
**Auth:** Required  
**Authorization:** Organization admin  
**Response:** `200 OrganisationUserResponse`

No body. The current backend sets the global account active flag back to true.

## 6. Invitation Endpoints

### Invite a user

`POST /api/v1/organisations/{organisationId}/invitations`  
**Auth:** Required  
**Authorization:** Organization admin  
**Response:** `202 Accepted` with no response body

Request:

```json
{
  "email": "new.user@example.com",
  "roleId": 12
}
```

`roleId` is optional. When omitted, the backend uses the organization `MEMBER` role. The invitation token is hashed in the database and expires after 48 hours. The frontend receives the invitation link by email when mail is configured; during development it may be logged by the backend.

Show these states explicitly:

- Invitation sent.
- An active invitation already exists.
- The email is already an active member.
- The invitation has expired.
- The selected role does not belong to this organization.

### Accept an invitation

`POST /api/v1/invitations/{token}/accept`  
**Auth:** Public, token-based  
**Response:** `200 AuthResponse`

Request for a new account:

```json
{
  "firstName": "New",
  "lastName": "User",
  "phoneNumber": "+212 600 000 001",
  "password": "StrongPass123!"
}
```

The email is taken from the invitation and is not supplied by the frontend. The page must support an invitation token for:

- A completely new user account.
- An existing inactive user who is being activated.
- An existing active member, which must be shown as an error.

For a new account, first name, last name, and password are required. These requirements are validated in the service layer, so missing values can return a general business-rule error instead of field-level validation errors.

After success, store the returned auth state and navigate to the invited organization.

## 7. Team Endpoints

All team endpoints use an organization path. The organization ID is never sufficient by itself; the backend checks the user's active membership and permission.

### List teams

`GET /api/v1/organisations/{organisationId}/teams`  
**Permission:** `team.read`  
**Response:** `200 TeamResponse[]`

### Get a team

`GET /api/v1/organisations/{organisationId}/teams/{teamId}`  
**Permission:** `team.read`  
**Response:** `200 TeamResponse`

### List team members

`GET /api/v1/organisations/{organisationId}/teams/{teamId}/members`  
**Permission:** `team.read`  
**Response:** `200 TeamMemberResponse[]`

### Create a team

`POST /api/v1/organisations/{organisationId}/teams`  
**Permission:** `team.create`  
**Response:** `201 TeamResponse`

Request:

```json
{
  "name": "Product"
}
```

The name must be unique within the organization.

### Update a team

`PUT /api/v1/organisations/{organisationId}/teams/{teamId}`  
**Permission:** `team.update`  
**Response:** `200 TeamResponse`

Request:

```json
{
  "name": "Product and Design"
}
```

### Add a member to a team

`POST /api/v1/organisations/{organisationId}/teams/{teamId}/members`  
**Permission:** `team.member.add`  
**Response:** `201 TeamMemberResponse`

Request:

```json
{
  "userId": 42
}
```

The selected user must be an active member of the same organization and cannot already be in the team.

### Remove a member from a team

`DELETE /api/v1/organisations/{organisationId}/teams/{teamId}/members/{userId}`  
**Permission:** `team.member.remove`  
**Response:** `204 No Content`

### Assign a team leader

`PUT /api/v1/organisations/{organisationId}/teams/{teamId}/leader/{userId}`  
**Permission:** `team.leader.assign`  
**Response:** `200 TeamMemberResponse`

No body. The backend clears the previous leader and adds the selected active organization member to the team if necessary.

### Delete a team

`DELETE /api/v1/organisations/{organisationId}/teams/{teamId}`  
**Permission:** `team.delete`  
**Response:** `204 No Content`

## 8. Role Endpoints

### List roles

`GET /api/v1/organisations/{organisationId}/roles`  
**Permission:** `role.read`  
**Response:** `200 RoleResponse[]`

### Get a role

`GET /api/v1/organisations/{organisationId}/roles/{roleId}`  
**Permission:** `role.read`  
**Response:** `200 RoleResponse`

### List available permissions for role editing

`GET /api/v1/organisations/{organisationId}/roles/permissions`  
**Permission:** `permission.read`  
**Response:** `200 PermissionResponse[]`

This returns the global permission catalog. There is also a dedicated permissions CRUD resource below.
Use this endpoint to load permissions for the role editor; it enforces `permission.read` before returning the catalog.

### Create a role

`POST /api/v1/organisations/{organisationId}/roles`  
**Permission:** `role.create`  
**Response:** `201 RoleResponse`

Request:

```json
{
  "name": "Project Lead",
  "description": "Can manage project teams"
}
```

Role names are unique within the organization.

### Update a role

`PUT /api/v1/organisations/{organisationId}/roles/{roleId}`  
**Permission:** `role.update`  
**Response:** `200 RoleResponse`

Request:

```json
{
  "name": "Project Lead",
  "description": "Updated role description"
}
```

The `ADMIN` role cannot be renamed.

### Replace role permissions

`PUT /api/v1/organisations/{organisationId}/roles/{roleId}/permissions`  
**Permission:** `role.permission.assign`  
**Response:** `200 RoleResponse`

Request:

```json
{
  "permissionCodes": [
    "team.read",
    "team.create",
    "team.update"
  ]
}
```

This replaces the complete permission set. It is not an additive operation. The role editor should load the current permissions, let the user edit the full set, and submit the complete final array.

### Delete a role

`DELETE /api/v1/organisations/{organisationId}/roles/{roleId}`  
**Permission:** `role.delete`  
**Response:** `204 No Content`

The backend rejects deletion of `ADMIN` and deletion of any role that still has members. Reassign members before showing a successful delete state.

## 9. Permission Endpoints

Permissions are global definitions. The endpoint is organization-scoped so the backend can authorize the acting user through an active organization membership.

### List permissions

`GET /api/v1/organisations/{organisationId}/permissions`  
**Permission:** `permission.read`  
**Response:** `200 PermissionResponse[]`

### Create a permission

`POST /api/v1/organisations/{organisationId}/permissions`  
**Permission:** `permission.create`  
**Response:** `201 PermissionResponse`

Request:

```json
{
  "code": "workflow.execute",
  "description": "Execute workflows"
}
```

The code must match:

```text
[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+
```

Codes are unique globally. The frontend should suggest namespaced codes such as `module.action` or `module.resource.action`.

### Update a permission

`PUT /api/v1/organisations/{organisationId}/permissions/{permissionId}`  
**Permission:** `permission.update`  
**Response:** `200 PermissionResponse`

Request:

```json
{
  "code": "workflow.execute",
  "description": "Execute an approved workflow"
}
```

A permission code cannot be renamed while it is assigned to a role. Descriptions can be edited, but remember that permission definitions are shared globally.

### Delete a permission

`DELETE /api/v1/organisations/{organisationId}/permissions/{permissionId}`  
**Permission:** `permission.delete`  
**Response:** `204 No Content`

The backend rejects deletion while any role still uses the permission. Unassign it from every role first.

## 10. Permission Catalog and Default Roles

The current default permission codes are:

| Code | Meaning |
|---|---|
| `team.read` | View teams and team members. |
| `team.create` | Create teams. |
| `team.update` | Update teams. |
| `team.delete` | Delete teams. |
| `team.member.add` | Add users to teams. |
| `team.member.remove` | Remove users from teams. |
| `team.leader.assign` | Assign team leaders. |
| `role.read` | View roles. |
| `role.create` | Create roles. |
| `role.update` | Update roles. |
| `role.delete` | Delete roles. |
| `role.permission.assign` | Replace permissions on a role. |
| `permission.read` | View the permission catalog. |
| `permission.create` | Create a permission definition. |
| `permission.update` | Update a permission definition. |
| `permission.delete` | Delete an unused permission definition. |

Default role intent:

| Role | Default access |
|---|---|
| `ADMIN` | All seeded permissions. |
| `MANAGER` | Team read, create, update, member add/remove, and leader assignment. |
| `EMPLOYEE` | `team.read`. |
| `MEMBER` | `team.read`; the default invitation role. |

Do not hard-code `ADMIN` as the only frontend authorization rule. Use the permission codes returned by the role/member data available to the app, and still handle backend `403` responses.

## 11. Frontend Pages and Copy-Paste Prompts

These prompts are implementation briefs for a frontend agent or for design and development planning. Keep the product UI work-focused: dense tables for administration, clear organization context, restrained cards, and no fake dashboard data.

### 11.1 Auth pages

**Login page prompt**

> Build a focused FlowOS login page with email and password fields, inline validation, a password visibility toggle, a primary sign-in action, links to registration and forgot password, loading and error states, and keyboard-accessible form submission. Call `POST /api/v1/auth/login`. Show one generic invalid-credentials message. On success, store auth state in the API client and route to the last selected organization or organization onboarding.

**Registration page prompt**

> Build a FlowOS registration page with first name, last name, email, optional phone number, password, and password confirmation. Mirror backend validation, show password requirements before submission, call `POST /api/v1/auth/register`, and route directly into the authenticated organization setup flow after success. Never log or persist the password.

**Forgot password page prompt**

> Build a forgot-password page with one email field and a privacy-preserving success state that does not reveal whether the email exists. Call `POST /api/v1/auth/forgot-password`. Include a link back to login and handle rate-limit or generic error responses without exposing account existence.

**Reset password page prompt**

> Build a reset-password page that reads the one-time token from the invitation or reset URL, keeps it in transient memory, collects a new password and confirmation, calls `POST /api/v1/auth/reset-password`, and shows clear expired-token and already-used-token states. Never send the token to analytics.

**Invitation acceptance page prompt**

> Build an invitation acceptance page that reads the token from `/invitations/{token}`, shows the invited email when the backend provides it through the surrounding invitation flow, collects first name, last name, optional phone, password, and confirmation, calls `POST /api/v1/invitations/{token}/accept`, stores the returned JWT, and opens the invited organization. Include expired, used, already-member, and invalid-token states.

### 11.2 Application shell and organization context

**Authenticated app shell prompt**

> Build a responsive FlowOS application shell with a persistent organization switcher, primary navigation, user menu, logout action, breadcrumb context, loading boundary, and a permission-aware navigation model. The organization ID in the URL and API client must come from the active organization context. On `401`, clear auth state and route to login; on `403`, show a permission-denied state without retrying indefinitely.

**Organization onboarding prompt**

> Build an organization creation and empty-state flow with organization name, logo URL, and six-digit primary color fields. Call `POST /api/v1/organisations`. After success, make the new organization active and route to its overview. Explain permanent deletion only on the settings page, not during onboarding.

**Organization overview prompt**

> Build an organization overview page that calls `GET /api/v1/organisations/{organisationId}` and presents the organization identity, active context, member count when available from existing data, team entry points, and a clear empty state. Do not invent dashboard metrics because there is no dashboard endpoint yet.

**Organization settings prompt**

> Build an admin-only settings page with separate organization details, branding, and danger-zone sections. Use `PUT /api/v1/organisations/{organisationId}` for the required-name details form and `PATCH /api/v1/organisations/{organisationId}/settings` for partial branding changes. Require an explicit confirmation phrase before `DELETE /api/v1/organisations/{organisationId}` and explain that deletion is permanent.

### 11.3 User and membership pages

**My profile prompt**

> Build a profile page with read-only email, editable first name, last name, and phone number, plus a separate change-password section. Load `GET /api/v1/users/me`, update with `PATCH /api/v1/users/me`, and change the password with `POST /api/v1/auth/change-password`. Keep password values out of global state and clear them after each request.

**Organization members prompt**

> Build an organization member administration page with a searchable table, active/inactive filter, role display, profile edit action, invite action, and deactivate/reactivate actions. Use `GET /api/v1/organisations/{organisationId}/users`, `PATCH /users/{userId}`, and the deactivate/reactivate endpoints. Disable self-deactivation in the UI but still handle the backend rejection. Explain that current backend deactivation affects the user's global account.

**Invite member prompt**

> Build an invite-member modal or page with email and organization role selection. Load roles from `GET /api/v1/organisations/{organisationId}/roles`, submit `POST /api/v1/organisations/{organisationId}/invitations`, and show the `202` sent state separately from duplicate, invalid-role, and already-member errors.

### 11.4 Team pages

**Teams list prompt**

> Build a dense teams list page with team name, member count, created date, search or local filtering, create action gated by `team.create`, and row actions gated by `team.update` and `team.delete`. Load `GET /api/v1/organisations/{organisationId}/teams`; create with `POST`; update with `PUT`; delete with `DELETE`. Show a useful empty state for organizations without teams.

**Team details prompt**

> Build a team details page with team metadata, members table, leader indicator, add-member control, remove-member action, and assign-leader action. Load the team and members endpoints. Load candidate users from the organization members endpoint, never from another organization. Gate actions with `team.member.add`, `team.member.remove`, and `team.leader.assign`.

### 11.5 Role and permission pages

**Roles list prompt**

> Build an organization roles page with role name, description, member count, permission count, create, edit, permission editor, and delete actions. Use the role endpoints and gate actions with `role.read`, `role.create`, `role.update`, `role.permission.assign`, and `role.delete`. Mark `ADMIN` as protected because it cannot be renamed or deleted.

**Role editor prompt**

> Build a role create/edit form with name and description, plus a permission assignment editor for existing roles. Load the role and global permission catalog, display permissions grouped by namespace such as team, role, and permission, and submit the complete selected code array to `PUT /roles/{roleId}/permissions`. Warn that submitting replaces the entire permission set.

**Permission catalog prompt**

> Build an admin-facing permission catalog page with code, description, namespace grouping, create, edit-description, and delete-unused actions. Use the permissions endpoints. Make the global scope explicit in the UI, prevent code editing for assigned permissions, and explain that deleting requires unassigning the permission from every role.

### 11.6 System states

**403 page prompt**

> Build a compact permission-denied page that preserves the current organization context, explains that the account lacks access, and offers a safe route back to an allowed page. Do not suggest that the user retry the same request repeatedly.

**Session expired prompt**

> Build a session-expired dialog or route that appears on `401`, clears auth state, preserves a safe return path without storing sensitive request data, and routes to login. Do not display the JWT or raw server token in the UI.

**Global error and not-found prompt**

> Build a consistent error boundary for validation, conflict, not-found, network, and unexpected errors. Render field-level errors from the backend `errors` object, show `message` as a human-readable fallback, and provide retry only for safe idempotent reads.

## 12. API Client Recommendations

Create one API client instead of calling `fetch` or Axios directly from every component.

Recommended responsibilities:

1. Prefix every path with the configured API base URL.
2. Add `Content-Type` and `Accept` for JSON requests.
3. Add the bearer token to authenticated requests.
4. Parse the standard error shape.
5. On `401`, clear auth and redirect once.
6. On `403`, return a typed authorization error to the page.
7. Abort requests when a page unmounts or an organization changes.
8. Avoid retrying `POST`, `PUT`, `PATCH`, or `DELETE` automatically.
9. Invalidate affected queries after mutations.
10. Keep organization context in one source of truth.

Example TypeScript shape:

```ts
type ApiError = {
  message: string;
  errors: Record<string, string>;
};

type ApiResult<T> = {
  data: T;
  status: number;
};
```

Use typed functions such as:

```ts
api.auth.login(request)
api.organisations.get(organisationId)
api.organisations.users.list(organisationId, filters)
api.teams.create(organisationId, request)
api.roles.assignPermissions(organisationId, roleId, request)
```

Do not duplicate URL construction, permission names, or error parsing across pages.

## 13. Security Requirements and Best Practices

### Token handling

The current backend expects a bearer token in the `Authorization` header and does not expose a refresh-token endpoint.

Recommended frontend behavior:

- Prefer in-memory token storage where the product can tolerate login after a full browser restart.
- If persistent login is required, use a carefully designed secure storage strategy and understand the XSS tradeoff.
- Do not put JWTs, invitation tokens, reset tokens, or passwords in URLs, analytics events, logs, screenshots, or error telemetry.
- Do not assume an `httpOnly` cookie will work without changing backend authentication and CSRF configuration; the current contract is an `Authorization` header.
- Clear the token and user state on logout, `401`, and explicit session expiration.
- Do not decode a JWT and treat its claims as authorization truth. The backend checks active accounts, active memberships, and permissions.

### Organization isolation

- Treat every `organisationId` as untrusted input.
- Always use the active organization context for organization-scoped calls.
- Never use a user ID from one organization to add a member to a team in another organization.
- Do not merge cached organization data under one unscoped key. Include organization ID in query/cache keys.
- When switching organizations, cancel or invalidate requests from the previous organization.
- A successful response for organization A must never populate organization B's UI state.

### Authorization

Use permissions to hide or disable actions, but never rely on hidden buttons for security.

At minimum, handle these permissions:

```text
team.read
team.create
team.update
team.delete
team.member.add
team.member.remove
team.leader.assign
role.read
role.create
role.update
role.delete
role.permission.assign
permission.read
permission.create
permission.update
permission.delete
```

The backend can deny an action even when the UI previously showed it. This can happen after a role update, organization switch, account deactivation, or token expiration.

### Form and input safety

- Mirror backend validation for fast feedback, but always submit to the backend for final validation.
- Escape user-controlled names and descriptions when rendering them as HTML.
- Prefer text rendering over `innerHTML`.
- Validate URLs before showing logos; use an image component with safe loading behavior.
- Do not construct HTML from permission descriptions, team names, organization names, or email content.
- Clear password fields after submit, failure, route change, and logout.
- Never place a password in a URL or query parameter.

### Network and browser security

- Use HTTPS in production.
- Configure the backend CORS policy for the exact frontend origin; do not assume `*` is safe.
- Use a Content Security Policy where the hosting environment allows it.
- Do not expose database, SMTP, JWT secret, or backend-only environment variables in frontend builds.
- Use timeouts and cancellation for requests.
- Protect login, forgot-password, and reset-password screens against accidental double submission.
- Expect rate limiting or WAF behavior in production even though the current backend does not implement rate limiting itself.

### Destructive actions

Use confirmation for:

- Organization deletion.
- Team deletion.
- Role deletion.
- Permission deletion.
- User deactivation.

After a destructive success, invalidate related cached lists and remove the deleted object from the UI. Never show a stale success state for a failed request.

## 14. Current Limitations and Missing Backend APIs

These capabilities are described in the product specification but do not currently have public frontend endpoints:

- Dashboard widgets and personalized dashboard data.
- Module catalog, module installation, and module removal.
- Audit-log listing. Audit records are written server-side, but there is no `GET /audit-logs` endpoint.
- Notifications.
- Projects, tasks, documents, calendar, CRM, and other future modules.
- Refresh tokens.
- Server-side pagination and sorting for organization users, teams, roles, and permissions.
- A separate platform Super Administrator API.

Do not build API calls for these areas until backend contracts are added. Use clearly labeled empty states or feature flags instead of mock data that looks real.

Important backend caveats:

- Permission definitions are global, not organization-owned.
- Organization user deactivation currently changes the global user active flag.
- Organization and team deletion are hard deletes.
- Invitation emails may be logged to the backend console when mail is disabled.
- Permission changes and role changes can make an already-open screen stale; refetch after returning to a protected page.
- The current list endpoints return all matching records and may become expensive as data grows.

## 15. Frontend Acceptance Checklist

### Authentication

- [ ] Register returns an authenticated session.
- [ ] Login uses a generic invalid-credentials message.
- [ ] Logout clears client auth even if the server responds with an expired-token error.
- [ ] Reset tokens are never logged or sent to analytics.
- [ ] Expired and used invitation/reset tokens have dedicated UI states.
- [ ] `401` returns the user to login exactly once.

### Organization and users

- [ ] Organization switching scopes every request and cache key.
- [ ] Organization deletion requires explicit confirmation.
- [ ] User list filters are encoded as query parameters.
- [ ] Self-deactivation is disabled in the UI and handled defensively on the backend response.
- [ ] Global account deactivation impact is explained to administrators.

### Teams, roles, and permissions

- [ ] Team actions map to the correct permission code.
- [ ] Role permission editing submits the complete replacement list.
- [ ] `ADMIN` cannot be renamed or deleted in the UI.
- [ ] Role deletion warns when members must be reassigned.
- [ ] Global permission scope is visible to administrators.
- [ ] Assigned permission codes are not offered as editable rename actions.
- [ ] Every protected mutation handles `403` without corrupting local state.

### Quality and security

- [ ] No passwords or tokens are stored in global application state.
- [ ] No raw JWT or invitation/reset token appears in logs.
- [ ] Forms support keyboard navigation and accessible labels.
- [ ] Loading, empty, error, and success states exist for every page.
- [ ] Mobile layouts keep destructive actions deliberate and visible.
- [ ] End-to-end tests cover organization isolation and unauthorized team/role actions.
