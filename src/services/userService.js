import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

function requireDb() {
  if (!db) {
    throw new Error('Firebase არ არის კონფიგურირებული.')
  }
  return db
}

export async function updateDeveloperProfile(userId, { bio, experienceCategories, experienceYears }) {
  const firestore = requireDb()
  await updateDoc(doc(firestore, 'users', userId), {
    bio: bio || '',
    experienceCategories: experienceCategories || [],
    experienceYears: experienceYears || '',
  })
}
