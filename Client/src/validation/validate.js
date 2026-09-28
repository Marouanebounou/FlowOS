import { ValidationError } from 'yup'

export function getErrors(schema, values) {
  try {
    schema.validateSync(values, { abortEarly: false })
    return {}
  } catch (err) {
    const errors = {}
    if (err instanceof ValidationError) {
      err.inner.forEach((e) => {
        if (e.path && !errors[e.path]) errors[e.path] = e.message
      })
      if (Object.keys(errors).length === 0 && err.message) return { _error: err.message }
    }
    return errors
  }
}

export function getError(schema, values) {
  try {
    schema.validateSync(values, { abortEarly: false })
    return null
  } catch (err) {
    if (err instanceof ValidationError) return err.errors[0] || null
    return null
  }
}
