export { ADMIN_EMAIL, ADMIN_PASSWORD, ensureAdminAccountFor } from './ensureAdminAccountCore'

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function ensureAdminAccount({ retries = 8, delayMs = 500 } = {}) {
  const { auth, db, isFirebaseConfigured } = await import('../firebase.js')
  const { ensureAdminAccountFor } = await import('./ensureAdminAccountCore.js')

  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase არ არის კონფიგურირებული.')
  }

  let lastError

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await ensureAdminAccountFor(auth, db)
    } catch (err) {
      lastError = err
      if (attempt < retries - 1) {
        await wait(delayMs)
      }
    }
  }

  throw lastError
}
