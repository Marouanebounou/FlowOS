import * as yup from 'yup'

const phoneTest = (message) => ({
  name: 'phone',
  message,
  test: (v) => !v || !v.trim() || /^[\d+()\-\s]+$/.test(v.trim()),
})

const httpUrlTest = (message) => ({
  name: 'http-url',
  message,
  test: (v) => {
    if (!v || !v.trim()) return true
    try {
      const u = new URL(v.trim())
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  },
})

const emailField = (requiredMessage) =>
  yup.string().trim().required(requiredMessage).email('Email must be valid')

const passwordField = (minMessage) =>
  yup.string().required('Password is required').min(8, minMessage || 'Password must be at least 8 characters')

const nameField = (requiredMessage) =>
  yup.string().trim().required(requiredMessage).max(255, 'Max 255')

export const loginSchema = yup.object({
  email: yup.string().trim().required('Email is required').email('Email must be valid'),
  password: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = yup.object({
  firstName: nameField('First name is required'),
  lastName: nameField('Last name is required'),
  email: emailField('Email is required'),
  password: yup.string().required('Password is required').min(8, 'Min 8 characters'),
  confirmPassword: yup
    .string()
    .required('Please confirm password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
})

export const forgotPasswordSchema = yup.object({
  email: yup.string().trim().required('Valid email is required').email('Valid email is required'),
})

export const resetPasswordSchema = yup.object({
  newPassword: yup.string().required('New password must be at least 8 characters').min(8, 'New password must be at least 8 characters'),
  confirmPassword: yup
    .string()
    .required('Passwords do not match')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match'),
})

export const invitationSchema = yup.object({
  firstName: nameField('First name is required'),
  lastName: nameField('Last name is required'),
  phoneNumber: yup.string().test(phoneTest('Phone number is invalid')),
  password: yup.string().required('Password is required').min(8, 'Min 8 characters'),
  confirmPassword: yup
    .string()
    .required('Please confirm password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
})

export const profileSchema = yup.object({
  firstName: nameField('First name is required'),
  lastName: nameField('Last name is required'),
  phoneNumber: yup.string().test(phoneTest('Phone number is invalid')),
})

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().required('New password must be at least 8 characters').min(8, 'New password must be at least 8 characters'),
  confirmPassword: yup
    .string()
    .required('Passwords do not match')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match'),
})

export const organizationSchema = yup.object({
  name: yup.string().trim().required('Organisation name is required').max(255, 'Max 255 characters'),
  logoUrl: yup.string().max(500, 'Max 500 characters').test(httpUrlTest('Must be valid URL (https://...)')),
  primaryColor: yup
    .string()
    .max(20, 'Max 20 characters')
    .test({
      name: 'color',
      message: 'Valid hex like #6366f1',
      test: (v) => {
        if (!v || !v.trim()) return true
        return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(v.trim()) || /^[a-z]+$/i.test(v.trim())
      },
    }),
})

export const organizationDetailsSchema = yup.object({
  name: yup.string().trim().required('Organisation name is required').max(255, 'Max 255 characters'),
  logoUrl: yup.string().max(500, 'Logo URL max 500'),
})

export const brandingSchema = yup.object({
  name: yup.string().max(255, 'Name max 255'),
  logoUrl: yup.string().max(500, 'Logo URL max 500'),
  primaryColor: yup.string().test({
    name: 'hex-color',
    message: 'Primary color must be #RRGGBB',
    test: (v) => !v || !v.trim() || /^#[0-9A-Fa-f]{6}$/.test(v.trim()),
  }),
})

export const inviteMemberSchema = yup.object({
  email: emailField('Email is required'),
  roleId: yup.string().test({
    name: 'role',
    message: 'Invalid role',
    test: (v) => !v || !isNaN(Number(v)),
  }),
})

export const editMemberSchema = yup.object({
  firstName: yup.string().trim().required('First name is required'),
  lastName: yup.string().trim().required('Last name is required'),
  phoneNumber: yup.string().test(phoneTest('Phone number is invalid')),
})

export const teamSchema = yup.object({
  name: yup.string().trim().required('Team name is required').max(255, 'Max 255 characters'),
})

export const roleSchema = yup.object({
  name: yup.string().trim().required('Role name is required'),
})

export const taskSchema = yup.object({
  title: yup.string().trim().required('Title is required'),
})

export const projectSchema = yup.object({
  name: yup.string().trim().required('Name is required'),
})

export const calendarSchema = yup
  .object({
    title: yup.string().trim().required('Title is required'),
    startAt: yup.string().required('Start time is required'),
    endAt: yup.string().required('End time is required'),
  })
  .test({
    name: 'end-after-start',
    message: 'End must be after start',
    test: (v) => {
      if (!v?.startAt || !v?.endAt) return true
      return new Date(v.endAt) > new Date(v.startAt)
    },
  })

export const crmSchema = yup.object({
  name: yup.string().trim().required('Name is required'),
})

export const documentSchema = yup.object({
  name: yup.string().trim().required('Name is required'),
  fileUrl: yup.string().trim().required('File URL is required').test(httpUrlTest('File URL must be valid')),
})

export { passwordField }
