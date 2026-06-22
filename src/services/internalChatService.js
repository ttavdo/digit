import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { formatMessageTime, formatRelativeTime } from './chatService'

export { formatMessageTime, formatRelativeTime }

function requireDb() {
  if (!db) {
    throw new Error('Firebase არ არის კონფიგურირებული.')
  }
  return db
}

export function buildParticipantPairKey(uidA, uidB) {
  return [uidA, uidB].sort().join('_')
}

export function isInternalChatUnread(chat, userId) {
  if (!chat?.lastMessageText) return false
  const readBy = chat.lastMessageReadBy || []
  return !readBy.includes(userId)
}

export function getOtherParticipant(chat, userId) {
  if (chat.otherUserId) {
    return {
      uid: chat.otherUserId,
      name: chat.otherUserName || chat.participantNames?.[chat.otherUserId] || 'თანამშრომელი',
      role: chat.otherUserRole || chat.participantRoles?.[chat.otherUserId] || 'developer',
    }
  }

  const otherId = chat.participantIds?.find((id) => id !== userId)
  if (!otherId) return null
  return {
    uid: otherId,
    name: chat.participantNames?.[otherId] || 'თანამშრომელი',
    role: chat.participantRoles?.[otherId] || 'developer',
  }
}

export function subscribeToStaffMembers(currentUserId, onMembers, onError) {
  const firestore = requireDb()
  const usersRef = collection(firestore, 'users')
  const developerQuery = query(usersRef, where('role', '==', 'developer'))
  const managerQuery = query(usersRef, where('role', '==', 'manager'))

  const membersById = new Map()
  let devReady = false
  let mgrReady = false

  const syncRole = (role, snapshot) => {
    for (const [id, member] of membersById.entries()) {
      if (member.role === role) membersById.delete(id)
    }
    snapshot.docs.forEach((docSnap) => {
      membersById.set(docSnap.id, {
        uid: docSnap.id,
        ...docSnap.data(),
      })
    })
  }

  const emitMembers = () => {
    if (!devReady || !mgrReady) return

    const members = [...membersById.values()]
      .filter((member) => member.uid !== currentUserId)
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ka'))
    onMembers(members)
  }

  const unsubscribeDevelopers = onSnapshot(
    developerQuery,
    (snapshot) => {
      syncRole('developer', snapshot)
      devReady = true
      emitMembers()
    },
    (err) => onError?.(err),
  )

  const unsubscribeManagers = onSnapshot(
    managerQuery,
    (snapshot) => {
      syncRole('manager', snapshot)
      mgrReady = true
      emitMembers()
    },
    (err) => onError?.(err),
  )

  return () => {
    unsubscribeDevelopers()
    unsubscribeManagers()
  }
}

function getTimestampMillis(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (typeof value.toDate === 'function') return value.toDate().getTime()
  if (typeof value.seconds === 'number') return value.seconds * 1000
  return 0
}

function sortChatsByLastMessage(chats) {
  return [...chats].sort(
    (a, b) => getTimestampMillis(b.lastMessageAt) - getTimestampMillis(a.lastMessageAt),
  )
}

function mapInboxDoc(docSnap) {
  const data = docSnap.data()
  return {
    id: docSnap.id,
    ...data,
    participantIds: data.participantIds || [],
    participantNames: data.participantNames || {},
    participantRoles: data.participantRoles || {},
  }
}

async function syncInboxEntries(firestore, chatId, chatData) {
  const { participantIds, participantNames, participantRoles, lastMessageText, lastMessageReadBy, lastMessageAt } =
    chatData

  await Promise.all(
    participantIds.map((ownerId) => {
      const otherId = participantIds.find((id) => id !== ownerId)
      return setDoc(
        doc(firestore, 'users', ownerId, 'internalChatInbox', chatId),
        {
          chatId,
          participantIds,
          participantPairKey: chatId,
          participantNames,
          participantRoles,
          otherUserId: otherId,
          otherUserName: participantNames?.[otherId] || 'თანამშრომელი',
          otherUserRole: participantRoles?.[otherId] || 'developer',
          lastMessageText: lastMessageText ?? '',
          lastMessageReadBy: lastMessageReadBy ?? [ownerId],
          lastMessageAt: lastMessageAt ?? serverTimestamp(),
        },
        { merge: true },
      )
    }),
  )
}

export function subscribeToInternalChats(userId, onChats, onError) {
  const firestore = requireDb()
  const inboxQuery = query(
    collection(firestore, 'users', userId, 'internalChatInbox'),
    orderBy('lastMessageAt', 'desc'),
  )

  return onSnapshot(
    inboxQuery,
    (snapshot) => {
      const chats = sortChatsByLastMessage(snapshot.docs.map(mapInboxDoc))
      onChats(chats)
    },
    onError,
  )
}

export function subscribeToInternalMessages(chatId, onMessages, onError) {
  const firestore = requireDb()
  const messagesQuery = query(
    collection(firestore, 'internalChats', chatId, 'messages'),
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

export async function findOrCreateInternalChat({
  currentUserId,
  currentUserName,
  currentUserRole,
  otherUserId,
  otherUserName,
  otherUserRole,
}) {
  const firestore = requireDb()
  const pairKey = buildParticipantPairKey(currentUserId, otherUserId)
  const chatRef = doc(firestore, 'internalChats', pairKey)
  const existing = await getDoc(chatRef)

  const participantIds = [currentUserId, otherUserId].sort()
  const participantNames = {
    [currentUserId]: currentUserName,
    [otherUserId]: otherUserName,
  }
  const participantRoles = {
    [currentUserId]: currentUserRole,
    [otherUserId]: otherUserRole,
  }

  if (existing.exists()) {
    await syncInboxEntries(firestore, pairKey, {
      ...existing.data(),
      participantIds: existing.data().participantIds || participantIds,
      participantNames: existing.data().participantNames || participantNames,
      participantRoles: existing.data().participantRoles || participantRoles,
    })
    return pairKey
  }

  const chatData = {
    participantIds,
    participantPairKey: pairKey,
    participantNames,
    participantRoles,
    lastMessageText: '',
    lastMessageReadBy: [currentUserId],
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  }

  await setDoc(chatRef, chatData)
  await syncInboxEntries(firestore, pairKey, chatData)

  return pairKey
}

export async function sendInternalMessage(chatId, { senderId, senderName, text }) {
  const firestore = requireDb()
  const messagesRef = collection(firestore, 'internalChats', chatId, 'messages')
  const preview = text.slice(0, 120)

  await addDoc(messagesRef, {
    senderId,
    senderName,
    text,
    createdAt: serverTimestamp(),
  })

  const chatSnap = await getDoc(doc(firestore, 'internalChats', chatId))
  const participantIds = chatSnap.data()?.participantIds || []

  await updateDoc(doc(firestore, 'internalChats', chatId), {
    lastMessageAt: serverTimestamp(),
    lastMessageText: preview,
    lastMessageReadBy: [senderId],
  })

  await Promise.all(
    participantIds.map((ownerId) =>
      updateDoc(doc(firestore, 'users', ownerId, 'internalChatInbox', chatId), {
        lastMessageAt: serverTimestamp(),
        lastMessageText: preview,
        lastMessageReadBy: [senderId],
      }),
    ),
  )
}

export async function markInternalChatAsRead(chatId, userId) {
  const firestore = requireDb()
  await updateDoc(doc(firestore, 'internalChats', chatId), {
    lastMessageReadBy: arrayUnion(userId),
  })
  await updateDoc(doc(firestore, 'users', userId, 'internalChatInbox', chatId), {
    lastMessageReadBy: arrayUnion(userId),
  })
}

export const STAFF_ROLE_LABELS = {
  developer: 'დეველოპერი',
  manager: 'მენეჯერი',
}
