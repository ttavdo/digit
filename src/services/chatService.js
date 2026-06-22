import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'

function requireDb() {
  if (!db) {
    throw new Error('Firebase არ არის კონფიგურირებული.')
  }
  return db
}

async function updateConversationMeta(conversationId, text) {
  const firestore = requireDb()
  await updateDoc(doc(firestore, 'conversations', conversationId), {
    lastMessageAt: serverTimestamp(),
    lastMessageText: text.slice(0, 120),
  })
}

export async function findOrCreateOpenConversation({
  customerId,
  customerName,
  type,
  serviceRequested = null,
}) {
  const firestore = requireDb()
  const conversationsRef = collection(firestore, 'conversations')
  const openQuery = query(
    conversationsRef,
    where('customerId', '==', customerId),
    where('type', '==', type),
    where('status', '==', 'open'),
  )

  const snapshot = await getDocs(openQuery)

  if (!snapshot.empty) {
    return snapshot.docs[0].id
  }

  const newConversation = await addDoc(conversationsRef, {
    customerId,
    customerName,
    type,
    status: 'open',
    serviceRequested,
    lastMessageText: '',
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  })

  return newConversation.id
}

export function subscribeToConversations(staffType, status, onConversations, onError) {
  const firestore = requireDb()
  const conversationsQuery = query(
    collection(firestore, 'conversations'),
    where('type', '==', staffType),
    where('status', '==', status),
    orderBy('lastMessageAt', 'desc'),
  )

  return onSnapshot(
    conversationsQuery,
    (snapshot) => {
      const conversations = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      onConversations(conversations)
    },
    onError,
  )
}

export function subscribeToMessages(conversationId, onMessages, onError) {
  const firestore = requireDb()
  const messagesQuery = query(
    collection(firestore, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
  )

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((messageDoc) => ({
        id: messageDoc.id,
        ...messageDoc.data(),
      }))
      onMessages(messages)
    },
    onError,
  )
}

export async function sendCustomerMessage(conversationId, { senderId, text }) {
  const firestore = requireDb()
  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages')

  await addDoc(messagesRef, {
    senderId,
    senderRole: 'customer',
    text,
    createdAt: serverTimestamp(),
  })

  await updateDoc(doc(firestore, 'conversations', conversationId), {
    lastMessageAt: serverTimestamp(),
    lastMessageText: text.slice(0, 120),
  })
}

export async function sendStaffMessage(conversationId, { senderId, senderRole, text }) {
  const firestore = requireDb()
  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages')

  await addDoc(messagesRef, {
    senderId,
    senderRole,
    text,
    createdAt: serverTimestamp(),
  })

  await updateConversationMeta(conversationId, text)
}

export async function closeConversation(conversationId) {
  const firestore = requireDb()
  await updateDoc(doc(firestore, 'conversations', conversationId), {
    status: 'closed',
  })
}

export function formatMessageTime(timestamp) {
  if (!timestamp) return ''

  const date =
    typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString('ka-GE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return ''

  const date =
    typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)

  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'ახლახან'
  if (diffMins < 60) return `${diffMins} წუთის წინ`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} საათის წინ`

  return date.toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' })
}
