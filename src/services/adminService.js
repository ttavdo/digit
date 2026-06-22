import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { DEVELOPER_REQUEST_STATUS } from '../utils/roles'

function requireDb() {
  if (!db) {
    throw new Error('Firebase არ არის კონფიგურირებული.')
  }
  return db
}

export function subscribeToPendingDeveloperRequests(onRequests, onError) {
  const firestore = requireDb()
  const pendingQuery = query(
    collection(firestore, 'users'),
    where('developerRequestStatus', '==', DEVELOPER_REQUEST_STATUS.PENDING),
  )

  return onSnapshot(
    pendingQuery,
    (snapshot) => {
      const requests = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .sort((a, b) => {
          const aTime = a.developerRequestedAt?.toMillis?.() ?? 0
          const bTime = b.developerRequestedAt?.toMillis?.() ?? 0
          return bTime - aTime
        })
      onRequests(requests)
    },
    onError,
  )
}

export async function approveDeveloperRequest(userId, reviewerId) {
  const firestore = requireDb()
  await updateDoc(doc(firestore, 'users', userId), {
    role: 'developer',
    developerRequestStatus: DEVELOPER_REQUEST_STATUS.APPROVED,
    developerReviewedAt: serverTimestamp(),
    developerReviewedBy: reviewerId,
  })
}

export async function rejectDeveloperRequest(userId, reviewerId) {
  const firestore = requireDb()
  await updateDoc(doc(firestore, 'users', userId), {
    role: 'customer',
    developerRequestStatus: DEVELOPER_REQUEST_STATUS.REJECTED,
    developerReviewedAt: serverTimestamp(),
    developerReviewedBy: reviewerId,
  })
}
