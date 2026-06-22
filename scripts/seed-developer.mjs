import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import {
  DEVELOPER_EMAIL,
  DEVELOPER_PASSWORD,
  ensureDeveloperAccountFor,
} from '../src/utils/ensureDeveloperAccountCore.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnvFile() {
  try {
    const envPath = resolve(__dirname, '../.env')
    const content = readFileSync(envPath, 'utf8')

    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const eq = trimmed.indexOf('=')
      if (eq === -1) continue

      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // .env is optional when vars are already exported
  }
}

loadEnvFile()

const useEmulator = process.env.VITE_USE_FIREBASE_EMULATOR === 'true'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyForLocalEmulatorOnly123456',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-homework.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'demo-homework',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-homework.appspot.com',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abc123def456',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

if (useEmulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

ensureDeveloperAccountFor(auth, db, { autoApprove: true })
  .then(() => {
    console.log(`Developer account ready: ${DEVELOPER_EMAIL} / ${DEVELOPER_PASSWORD}`)
    console.log('Role: developer (approved)')
    if (!useEmulator) {
      console.log('Login at /login or /developer-dashboard')
    }
  })
  .catch((err) => {
    console.error(`Developer seed failed: ${err.message}`)
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      console.error('Admin account missing. Create admin@gmail.com first (register or npm run seed-admin).')
    }
    process.exit(1)
  })
