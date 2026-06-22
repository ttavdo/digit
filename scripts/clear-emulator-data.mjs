const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'demo-homework'
const AUTH_EMULATOR = 'http://127.0.0.1:9099'
const FIRESTORE_EMULATOR = 'http://127.0.0.1:8080'

async function clearAuthUsers() {
  const url = `${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/accounts`
  const response = await fetch(url, { method: 'DELETE' })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Auth clear failed (${response.status}): ${text}`)
  }
}

async function clearFirestoreData() {
  const url = `${FIRESTORE_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`
  const response = await fetch(url, { method: 'DELETE' })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Firestore clear failed (${response.status}): ${text}`)
  }
}

async function clearEmulatorData() {
  await clearAuthUsers()
  await clearFirestoreData()
}

export { clearEmulatorData, PROJECT_ID }
