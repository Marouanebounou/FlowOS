const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

const TOKEN_KEY = 'flowos_token'

let bearerToken = (() => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
})()

async function parseError(response) {
  try {
    return await response.clone().json()
  } catch {
    return {}
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  }

  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
    signal: options.signal,
  })

  if (response.status === 401) {
    bearerToken = null
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('flowos_user')
    } catch {

    }
    window.dispatchEvent(new CustomEvent('auth:logout'))
    return { data: null, status: 401, error: { message: 'Session expired' } }
  }

  if (!response.ok) {
    const error = await parseError(response)
    return { data: null, status: response.status, error }
  }

  if (response.status === 204 || response.status === 202) {

    const contentLength = response.headers.get('content-length')
    const contentType = response.headers.get('content-type') || ''
    if (contentLength === '0' || !contentType.includes('application/json')) {
      return { data: null, status: response.status }
    }
    try {
      const data = await response.json()
      return { data, status: response.status }
    } catch {
      return { data: null, status: response.status }
    }
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return { data: null, status: response.status }
  }
  try {
    const data = await response.json()
    return { data, status: response.status }
  } catch {
    return { data: null, status: response.status }
  }
}

export const api = {
  setToken(token) {
    bearerToken = token
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {

    }
  },
  clearToken() {
    bearerToken = null
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('flowos_user')
    } catch {

    }
  },
  getToken() {
    return bearerToken
  },
  login(credentials) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },
  register(data) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  logout() {
    return request('/auth/logout', { method: 'POST' })
  },
  getProfile() {
    return request('/users/me')
  },
  updateProfile(data) {
    return request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
  changePassword(data) {
    return request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  forgotPassword(email) {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
  resetPassword(token, newPassword) {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    })
  },
  createOrganization(data) {
    return request('/organisations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  listOrganizations() {
    return request('/organisations')
  },
  getOrganization(id) {
    return request(`/organisations/${id}`)
  },
  listOrganizationUsers(organisationId, filters = {}) {
    const qs = new URLSearchParams()
    if (filters.name) qs.set('name', filters.name)
    if (filters.email) qs.set('email', filters.email)
    if (filters.active != null && filters.active !== '') qs.set('active', String(filters.active))
    const suffix = qs.toString() ? `?${qs}` : ''
    return request(`/organisations/${organisationId}/users${suffix}`)
  },
  deactivateUser(organisationId, userId) {
    return request(`/organisations/${organisationId}/users/${userId}/deactivate`, { method: 'PATCH' })
  },
  reactivateUser(organisationId, userId) {
    return request(`/organisations/${organisationId}/users/${userId}/reactivate`, { method: 'PATCH' })
  },
  inviteUser(organisationId, data) {
    return request(`/organisations/${organisationId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  listRoles(organisationId) {
    return request(`/organisations/${organisationId}/roles`)
  },
  listRolesPermissions(organisationId) {
    return request(`/organisations/${organisationId}/roles/permissions`)
  },
  acceptInvitation(token, data) {
    return request(`/invitations/${encodeURIComponent(token)}/accept`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  getMyMembership(organisationId) {
    return request(`/organisations/${organisationId}/me`)
  },
  getMyPermissions(organisationId) {
    return request(`/organisations/${organisationId}/me/permissions`)
  },
  listTeams(organisationId) {
    return request(`/organisations/${organisationId}/teams`)
  },
  getTeam(organisationId, teamId) {
    return request(`/organisations/${organisationId}/teams/${teamId}`)
  },
  createTeam(organisationId, data) {
    return request(`/organisations/${organisationId}/teams`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  updateTeam(organisationId, teamId, data) {
    return request(`/organisations/${organisationId}/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  deleteTeam(organisationId, teamId) {
    return request(`/organisations/${organisationId}/teams/${teamId}`, { method: 'DELETE' })
  },
  listTeamMembers(organisationId, teamId) {
    return request(`/organisations/${organisationId}/teams/${teamId}/members`)
  },
  addTeamMember(organisationId, teamId, userId) {
    return request(`/organisations/${organisationId}/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  },
  removeTeamMember(organisationId, teamId, userId) {
    return request(`/organisations/${organisationId}/teams/${teamId}/members/${userId}`, { method: 'DELETE' })
  },
  assignTeamLeader(organisationId, teamId, userId) {
    return request(`/organisations/${organisationId}/teams/${teamId}/leader/${userId}`, { method: 'PUT' })
  },

  listTasks(organisationId, teamId) {
    return request(`/organisations/${organisationId}/teams/${teamId}/tasks`)
  },
  createTask(organisationId, teamId, data) {
    return request(`/organisations/${organisationId}/teams/${teamId}/tasks`, { method: 'POST', body: JSON.stringify(data) })
  },
  updateTask(organisationId, teamId, taskId, data) {
    return request(`/organisations/${organisationId}/teams/${teamId}/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  deleteTask(organisationId, teamId, taskId) {
    return request(`/organisations/${organisationId}/teams/${teamId}/tasks/${taskId}`, { method: 'DELETE' })
  },
  assignTask(organisationId, teamId, taskId, userId) {
    return request(`/organisations/${organisationId}/teams/${teamId}/tasks/${taskId}/assign/${userId}`, { method: 'PUT' })
  },
  listProjects(organisationId, teamId) {
    return request(`/organisations/${organisationId}/teams/${teamId}/projects`)
  },
  createProject(organisationId, teamId, data) {
    return request(`/organisations/${organisationId}/teams/${teamId}/projects`, { method: 'POST', body: JSON.stringify(data) })
  },
  updateProject(organisationId, teamId, projectId, data) {
    return request(`/organisations/${organisationId}/teams/${teamId}/projects/${projectId}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  deleteProject(organisationId, teamId, projectId) {
    return request(`/organisations/${organisationId}/teams/${teamId}/projects/${projectId}`, { method: 'DELETE' })
  },
  listCalendar(organisationId, teamId) {
    const qs = teamId ? `?teamId=${teamId}` : ''
    return request(`/organisations/${organisationId}/calendar${qs}`)
  },
  createCalendarEvent(organisationId, data) {
    return request(`/organisations/${organisationId}/calendar`, { method: 'POST', body: JSON.stringify(data) })
  },
  updateCalendarEvent(organisationId, eventId, data) {
    return request(`/organisations/${organisationId}/calendar/${eventId}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  deleteCalendarEvent(organisationId, eventId) {
    return request(`/organisations/${organisationId}/calendar/${eventId}`, { method: 'DELETE' })
  },
  listCrm(organisationId, teamId) {
    const qs = teamId ? `?teamId=${teamId}` : ''
    return request(`/organisations/${organisationId}/crm${qs}`)
  },
  createCrmContact(organisationId, data) {
    return request(`/organisations/${organisationId}/crm`, { method: 'POST', body: JSON.stringify(data) })
  },
  updateCrmContact(organisationId, contactId, data) {
    return request(`/organisations/${organisationId}/crm/${contactId}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  deleteCrmContact(organisationId, contactId) {
    return request(`/organisations/${organisationId}/crm/${contactId}`, { method: 'DELETE' })
  },
  listDocuments(organisationId, teamId) {
    const qs = teamId ? `?teamId=${teamId}` : ''
    return request(`/organisations/${organisationId}/documents${qs}`)
  },
  createDocument(organisationId, data) {
    return request(`/organisations/${organisationId}/documents`, { method: 'POST', body: JSON.stringify(data) })
  },
  updateDocument(organisationId, documentId, data) {
    return request(`/organisations/${organisationId}/documents/${documentId}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  deleteDocument(organisationId, documentId) {
    return request(`/organisations/${organisationId}/documents/${documentId}`, { method: 'DELETE' })
  },
  listRolesFull(organisationId) {
    return request(`/organisations/${organisationId}/roles`)
  },
  createRole(organisationId, data) {
    return request(`/organisations/${organisationId}/roles`, { method: 'POST', body: JSON.stringify(data) })
  },
  updateRole(organisationId, roleId, data) {
    return request(`/organisations/${organisationId}/roles/${roleId}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  deleteRole(organisationId, roleId) {
    return request(`/organisations/${organisationId}/roles/${roleId}`, { method: 'DELETE' })
  },
  assignRolePermissions(organisationId, roleId, permissionCodes) {
    return request(`/organisations/${organisationId}/roles/${roleId}/permissions`, { method: 'PUT', body: JSON.stringify({ permissionCodes }) })
  },
  listPermissions(organisationId) {
    return request(`/organisations/${organisationId}/permissions`)
  },
  createPermission(organisationId, data) {
    return request(`/organisations/${organisationId}/permissions`, { method: 'POST', body: JSON.stringify(data) })
  },
  updatePermission(organisationId, permissionId, data) {
    return request(`/organisations/${organisationId}/permissions/${permissionId}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  deletePermission(organisationId, permissionId) {
    return request(`/organisations/${organisationId}/permissions/${permissionId}`, { method: 'DELETE' })
  },
  listModules() {
    return request('/modules')
  },
  listInstalledModules(organisationId) {
    return request(`/organisations/${organisationId}/modules`)
  },
  installModule(organisationId, moduleKey) {
    return request(`/organisations/${organisationId}/modules/${encodeURIComponent(moduleKey)}`, { method: 'POST' })
  },
  uninstallModule(organisationId, moduleKey) {
    return request(`/organisations/${organisationId}/modules/${encodeURIComponent(moduleKey)}`, { method: 'DELETE' })
  },
  setModuleEnabled(organisationId, moduleKey, enabled) {
    return request(`/organisations/${organisationId}/modules/${encodeURIComponent(moduleKey)}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    })
  },
  setModuleResponsable(organisationId, moduleKey, userId) {
    return request(`/organisations/${organisationId}/modules/${encodeURIComponent(moduleKey)}/responsable/${userId}`, { method: 'PUT' })
  },
  listModuleTeams(organisationId, moduleKey) {
    return request(`/organisations/${organisationId}/modules/${encodeURIComponent(moduleKey)}/teams`)
  },
  addModuleTeam(organisationId, moduleKey, teamId) {
    return request(`/organisations/${organisationId}/modules/${encodeURIComponent(moduleKey)}/teams/${teamId}`, { method: 'POST' })
  },
  removeModuleTeam(organisationId, moduleKey, teamId) {
    return request(`/organisations/${organisationId}/modules/${encodeURIComponent(moduleKey)}/teams/${teamId}`, { method: 'DELETE' })
  },
  updateOrganization(organisationId, data) {
    return request(`/organisations/${organisationId}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  updateOrganizationSettings(organisationId, data) {
    return request(`/organisations/${organisationId}/settings`, { method: 'PATCH', body: JSON.stringify(data) })
  },
  deleteOrganization(organisationId) {
    return request(`/organisations/${organisationId}`, { method: 'DELETE' })
  },
  updateOrganizationMember(organisationId, userId, data) {
    return request(`/users/organisations/${organisationId}/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) })
  },
}
