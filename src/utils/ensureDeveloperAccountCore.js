import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './ensureAdminAccountCore.js'

export const DEVELOPER_EMAIL = 'dev@gmail.com'
export const DEVELOPER_PASSWORD = 'dev123'
export const DEVELOPER_NAME = 'ტესტ შემსრულებელი'

const DEVELOPER_BIO = 'ვებ-დეველოპმენტი, React და Firebase.'
const DEVELOPER_EXPERIENCE_CATEGORIES = ['website', 'it-support-business']
const DEVELOPER_EXPERIENCE_YEARS = '3-5'

async function writePendingDeveloperProfile(firestore, uid) {
  await setDoc(doc(firestore, 'users', uid), {
    uid,
    name: DEVELOPER_NAME,
    email: DEVELOPER_EMAIL,
    role: 'customer',
    developerRequestStatus: 'pending',
    developerRequestedAt: serverTimestamp(),
    bio: DEVELOPER_BIO,
    experienceCategories: DEVELOPER_EXPERIENCE_CATEGORIES,
    experienceYears: DEVELOPER_EXPERIENCE_YEARS,
    ratingAvg: 0,
    ratingCount: 0,
    ratingSum: 0,
    createdAt: serverTimestamp(),
  })
}

async function approveDeveloperAsManager(firestore, authClient, developerUid, managerUid) {
  await updateDoc(doc(firestore, 'users', developerUid), {
    role: 'developer',
    developerRequestStatus: 'approved',
    developerReviewedAt: serverTimestamp(),
    developerReviewedBy: managerUid,
  })

  if (authClient.currentUser) {
    await signOut(authClient)
  }
}

export async function ensureDeveloperAccountFor(authClient, firestore, { autoApprove = true } = {}) {
  let developerUid

  try {
    const credential = await createUserWithEmailAndPassword(
      authClient,
      DEVELOPER_EMAIL,
      DEVELOPER_PASSWORD,
    )
    developerUid = credential.user.uid
    await writePendingDeveloperProfile(firestore, developerUid)
  } catch (err) {
    if (err.code !== 'auth/email-already-in-use') throw err

    const credential = await signInWithEmailAndPassword(
      authClient,
      DEVELOPER_EMAIL,
      DEVELOPER_PASSWORD,
    )
    developerUid = credential.user.uid

    const snapshot = await getDoc(doc(firestore, 'users', developerUid))
    if (!snapshot.exists()) {
      await writePendingDeveloperProfile(firestore, developerUid)
    }
  } finally {
    if (authClient.currentUser) {
      await signOut(authClient)
    }
  }

  if (autoApprove) {
    const adminCredential = await signInWithEmailAndPassword(
      authClient,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    )
    const managerUid = adminCredential.user.uid

    const devSnapshot = await getDoc(doc(firestore, 'users', developerUid))
    const devData = devSnapshot.data()

    if (devData?.role !== 'developer' || devData?.developerRequestStatus !== 'approved') {
      await approveDeveloperAsManager(firestore, authClient, developerUid, managerUid)
    } else if (authClient.currentUser) {
      await signOut(authClient)
    }
  }

  return { email: DEVELOPER_EMAIL, uid: developerUid }
}
