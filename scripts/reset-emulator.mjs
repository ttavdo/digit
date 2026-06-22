import { clearEmulatorData } from './clear-emulator-data.mjs'
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { ADMIN_EMAIL, ensureAdminAccountFor } from '../src/utils/ensureAdminAccountCore.js'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyForLocalEmulatorOnly123456',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-homework.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'demo-homework',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-homework.appspot.com',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abc123def456',
}

async function resetEmulatorData() {
  await clearEmulatorData()
  console.log('Emulator data cleared (auth + firestore).')

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)

  await ensureAdminAccountFor(auth, db)
  console.log(`Admin account restored: ${ADMIN_EMAIL}`)
}

resetEmulatorData().catch((err) => {
  console.error(`Reset failed: ${err.message}`)
  console.error('Make sure emulators are running (npm run dev:all).')
  process.exit(1)
})
