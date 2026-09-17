const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

let bearerToken = null

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
    window.dispatchEvent(new CustomEvent('auth:logout'))
    return { data: null, status: 401, error: { message: 'Session expired' } }
  }

  if (!response.ok) {
    const error = await parseError(response)
    return { data: null, status: response.status, error }
  }

  if (response.status === 204) {
    return { data: null, status: 204 }
  }

  const data = await response.json()
  return { data, status: response.status }
}

export const api = {
  setToken(token) {
    bearerToken = token
  },
  clearToken() {
    bearerToken = null
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
  getOrganization(id) {
    return request(`/organisations/${id}`)
  },
}
