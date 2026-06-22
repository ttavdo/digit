import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare, Search, Send, Users } from 'lucide-react'
import {
  STAFF_ROLE_LABELS,
  findOrCreateInternalChat,
  formatMessageTime,
  formatRelativeTime,
  getOtherParticipant,
  isInternalChatUnread,
  markInternalChatAsRead,
  sendInternalMessage,
  subscribeToInternalChats,
  subscribeToInternalMessages,
  subscribeToStaffMembers,
} from '../../services/internalChatService'
import { MAX_MESSAGE_LENGTH, validateMessageLength } from '../../utils/validation'
import { isStaffRole } from '../../utils/roles'
import './InternalChatsPanel.css'

const EMPTY_ARRAY = []

function InternalChatsPanel({ user, userProfile, onError }) {
  const [sidebarMode, setSidebarMode] = useState('inbox')
  const [staffMembers, setStaffMembers] = useState([])
  const [chats, setChats] = useState([])
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadedChatId, setLoadedChatId] = useState(null)
  const [staffSearch, setStaffSearch] = useState('')
  const [input, setInput] = useState('')
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [startingChat, setStartingChat] = useState(false)
  const [pendingTarget, setPendingTarget] = useState(null)
  const messagesEndRef = useRef(null)

  const currentUserId = user?.uid
  const currentUserName = userProfile?.name || user?.email || 'თანამშრომელი'
  const currentUserRole = userProfile?.role
  const canUseInternalChat = Boolean(currentUserId && isStaffRole(currentUserRole))

  const selectedChat = chats.find((chat) => chat.id === selectedChatId)
  const otherParticipant = selectedChat ? getOtherParticipant(selectedChat, currentUserId) : null
  const activeParticipant = otherParticipant || pendingTarget
  const showChat = Boolean(selectedChatId && activeParticipant)

  const displayMessages =
    selectedChatId && loadedChatId === selectedChatId ? messages : EMPTY_ARRAY

  const unreadCount = useMemo(
    () => chats.filter((chat) => isInternalChatUnread(chat, currentUserId)).length,
    [chats, currentUserId],
  )

  const chatByOtherId = useMemo(() => {
    const map = new Map()
    chats.forEach((chat) => {
      const other = getOtherParticipant(chat, currentUserId)
      if (other?.uid) map.set(other.uid, chat)
    })
    return map
  }, [chats, currentUserId])

  const filteredStaff = useMemo(() => {
    const queryText = staffSearch.trim().toLowerCase()
    if (!queryText) return staffMembers
    return staffMembers.filter((member) => {
      const name = (member.name || member.email || '').toLowerCase()
      const roleLabel = (STAFF_ROLE_LABELS[member.role] || '').toLowerCase()
      return name.includes(queryText) || roleLabel.includes(queryText)
    })
  }, [staffMembers, staffSearch])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!canUseInternalChat) {
      setStaffMembers([])
      setLoadingStaff(false)
      return undefined
    }

    const unsubscribe = subscribeToStaffMembers(
      currentUserId,
      (list) => {
        setStaffMembers(list)
        setLoadingStaff(false)
        onError?.('')
      },
      (err) => {
        onError?.(err.message || 'თანამშრომლების ჩატვირთვა ვერ მოხერხდა.')
        setLoadingStaff(false)
      },
    )

    return unsubscribe
  }, [canUseInternalChat, currentUserId, onError])

  useEffect(() => {
    if (!canUseInternalChat) {
      setChats([])
      setLoadingChats(false)
      return undefined
    }

    const unsubscribe = subscribeToInternalChats(
      currentUserId,
      (list) => {
        setChats(list)
        setLoadingChats(false)
        onError?.('')
        setSelectedChatId((prev) => {
          if (prev && list.some((chat) => chat.id === prev)) return prev
          return prev
        })
      },
      (err) => {
        onError?.(err.message || 'შინაგანი საუბრების ჩატვირთვა ვერ მოხერხდა.')
        setLoadingChats(false)
      },
    )

    return unsubscribe
  }, [canUseInternalChat, currentUserId, onError])

  useEffect(() => {
    if (!loadingChats && chats.length === 0 && !selectedChatId) {
      setSidebarMode('staff')
    }
  }, [loadingChats, chats.length, selectedChatId])

  useEffect(() => {
    if (selectedChatId && chats.some((chat) => chat.id === selectedChatId)) {
      setPendingTarget(null)
    }
  }, [chats, selectedChatId])

  useEffect(() => {
    if (loadingChats || pendingTarget || !selectedChatId) return
    if (!chats.some((chat) => chat.id === selectedChatId)) {
      setSelectedChatId(null)
    }
  }, [chats, loadingChats, pendingTarget, selectedChatId])

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([])
      setLoadedChatId(null)
      return undefined
    }

    setLoadingMessages(true)
    const unsubscribe = subscribeToInternalMessages(
      selectedChatId,
      (list) => {
        setMessages(list)
        setLoadedChatId(selectedChatId)
        setLoadingMessages(false)
      },
      (err) => {
        onError?.(err.message || 'მესიჯების ჩატვირთვა ვერ მოხერხდა.')
        setLoadedChatId(selectedChatId)
        setLoadingMessages(false)
      },
    )

    return unsubscribe
  }, [selectedChatId, onError])

  useEffect(() => {
    if (!selectedChatId || !currentUserId) return
    markInternalChatAsRead(selectedChatId, currentUserId).catch(() => {})
  }, [selectedChatId, currentUserId, messages.length])

  useEffect(() => {
    scrollToBottom()
  }, [displayMessages, scrollToBottom])

  const handleSelectChat = (chatId) => {
    setPendingTarget(null)
    setSelectedChatId(chatId)
    setSidebarMode('inbox')
    setInput('')
  }

  const handleOpenStaffTab = () => {
    setSidebarMode('staff')
  }

  const handleStartChat = async (member) => {
    if (!currentUserId || !currentUserRole || !isStaffRole(currentUserRole) || startingChat) return

    setStartingChat(true)
    onError?.('')

    try {
      const chatId = await findOrCreateInternalChat({
        currentUserId,
        currentUserName,
        currentUserRole,
        otherUserId: member.uid,
        otherUserName: member.name || member.email || 'თანამშრომელი',
        otherUserRole: member.role,
      })
      setPendingTarget({
        uid: member.uid,
        name: member.name || member.email || 'თანამშრომელი',
        role: member.role,
      })
      setSelectedChatId(chatId)
      setSidebarMode('inbox')
      setInput('')
    } catch (err) {
      onError?.(err.message || 'საუბრის დაწყება ვერ მოხერხდა.')
    } finally {
      setStartingChat(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    const lengthError = validateMessageLength(text)
    if (!text || !selectedChatId || !currentUserId || sending || lengthError) {
      if (lengthError) onError?.(lengthError)
      return
    }

    setSending(true)
    onError?.('')

    try {
      await sendInternalMessage(selectedChatId, {
        senderId: currentUserId,
        senderName: currentUserName,
        text,
      })
      setInput('')
    } catch (err) {
      onError?.(err.message || 'მესიჯის გაგზავნა ვერ მოხერხდა.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="internal-chats">
      <aside className="internal-chats__sidebar">
        <div className="internal-chats__intro">
          <span className="internal-chats__intro-badge">შინაგანი</span>
          <p>თანამშრომლებს შორის საუბარი — მომხმარებლის ჩატებისგან ცალკე.</p>
        </div>

        <div className="dashboard-filters internal-chats__filters">
          <button
            type="button"
            className={`dashboard-filter ${sidebarMode === 'inbox' ? 'dashboard-filter--active' : ''}`}
            onClick={() => setSidebarMode('inbox')}
          >
            <MessageSquare size={14} />
            აქტიური საუბრები
            {unreadCount > 0 && (
              <span className="internal-chats__badge">{unreadCount}</span>
            )}
          </button>
          <button
            type="button"
            className={`dashboard-filter ${sidebarMode === 'staff' ? 'dashboard-filter--active' : ''}`}
            onClick={() => setSidebarMode('staff')}
          >
            <Users size={14} />
            თანამშრომლები
          </button>
        </div>

        {sidebarMode === 'staff' && (
          <div className="internal-chats__search">
            <Search size={16} className="internal-chats__search-icon" />
            <input
              type="search"
              className="internal-chats__search-field"
              placeholder="სახელი ან როლი..."
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
            />
          </div>
        )}

        <div className="internal-chats__list">
          {sidebarMode === 'inbox' ? (
            loadingChats ? (
              <p className="dashboard-list__empty">იტვირთება...</p>
            ) : chats.length === 0 ? (
              <div className="internal-chats__empty-sidebar">
                <p className="dashboard-list__empty">
                  აქტიური შინაგანი საუბრები არ არის.
                </p>
                <button
                  type="button"
                  className="btn btn--outline btn--sm internal-chats__empty-btn"
                  onClick={handleOpenStaffTab}
                >
                  <Users size={16} />
                  თანამშრომლის არჩევა
                </button>
              </div>
            ) : (
              chats.map((chat) => {
                const other = getOtherParticipant(chat, currentUserId)
                const unread = isInternalChatUnread(chat, currentUserId)
                return (
                  <button
                    key={chat.id}
                    type="button"
                    className={`internal-chats__item ${selectedChatId === chat.id ? 'internal-chats__item--active' : ''}`}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <div className="internal-chats__item-top">
                      <span className="internal-chats__item-name">{other?.name}</span>
                      {unread && <span className="internal-chats__unread-dot" aria-label="წაუკითხავი" />}
                      <span className={`internal-chats__role-badge internal-chats__role-badge--${other?.role}`}>
                        {STAFF_ROLE_LABELS[other?.role] ?? other?.role}
                      </span>
                    </div>
                    <p className="internal-chats__item-preview">
                      {chat.lastMessageText || 'მესიჯები არ არის'}
                    </p>
                    <span className="internal-chats__item-time">
                      {formatRelativeTime(chat.lastMessageAt)}
                    </span>
                  </button>
                )
              })
            )
          ) : loadingStaff ? (
            <p className="dashboard-list__empty">იტვირთება...</p>
          ) : filteredStaff.length === 0 ? (
            <p className="dashboard-list__empty">
              {staffSearch.trim() ? 'შედეგი ვერ მოიძებნა.' : 'სხვა თანამშრომელი არ არის.'}
            </p>
          ) : (
            filteredStaff.map((member) => {
              const existingChat = chatByOtherId.get(member.uid)
              const unread = existingChat
                ? isInternalChatUnread(existingChat, currentUserId)
                : false
              return (
                <button
                  key={member.uid}
                  type="button"
                  className="internal-chats__staff-item"
                  onClick={() => handleStartChat(member)}
                  disabled={startingChat}
                >
                  <div className="internal-chats__item-top">
                    <span className="internal-chats__item-name">
                      {member.name || member.email}
                    </span>
                    {unread && <span className="internal-chats__unread-dot" aria-label="წაუკითხავი" />}
                    <span className={`internal-chats__role-badge internal-chats__role-badge--${member.role}`}>
                      {STAFF_ROLE_LABELS[member.role] ?? member.role}
                    </span>
                  </div>
                  <span className="internal-chats__staff-action">
                    {existingChat ? 'საუბრის გახსნა' : 'ახალი საუბრის დაწყება'}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </aside>

      <main className="internal-chats__main dashboard-chat">
        {!showChat ? (
          <div className="internal-chats__empty-main">
            <div className="internal-chats__empty-icon" aria-hidden="true">
              <MessageSquare size={40} />
            </div>
            <h2 className="internal-chats__empty-title">შინაგანი საუბრები</h2>
            <p className="internal-chats__empty-text">
              {chats.length === 0
                ? 'აირჩიე თანამშრომელი მარცხენა სიიდან და დაიწყე საუბარი. ეს ჩატი მომხმარებლის საუბრებისგან ცალკეა.'
                : 'აირჩიე აქტიური საუბარი სიიდან ან დაიწყე ახალი თანამშრომელთან.'}
            </p>
            <button
              type="button"
              className="btn btn--primary internal-chats__empty-cta"
              onClick={handleOpenStaffTab}
            >
              <Users size={18} />
              {chats.length === 0 ? 'თანამშრომლის არჩევა' : 'ახალი საუბარი'}
            </button>
          </div>
        ) : (
          <>
            <div className="dashboard-chat__header internal-chats__header">
              <div>
                <span className="internal-chats__header-label">შინაგანი საუბარი</span>
                <h2 className="dashboard-chat__title">{activeParticipant.name}</h2>
                <p className="dashboard-chat__meta">
                  {STAFF_ROLE_LABELS[activeParticipant.role] ?? activeParticipant.role}
                </p>
              </div>
            </div>

            <div className="dashboard-chat__messages">
              {loadingMessages ? (
                <p className="dashboard-chat__loading">მესიჯები იტვირთება...</p>
              ) : displayMessages.length === 0 ? (
                <p className="dashboard-chat__loading">მესიჯები ჯერ არ არის. დაიწყე საუბარი.</p>
              ) : (
                displayMessages.map(({ id, text, senderId, senderName, createdAt }) => {
                  const isOwn = senderId === currentUserId
                  return (
                    <div
                      key={id}
                      className={`dashboard-bubble internal-chats__bubble ${isOwn ? 'dashboard-bubble--staff internal-chats__bubble--own' : 'dashboard-bubble--customer internal-chats__bubble--other'}`}
                    >
                      {!isOwn && (
                        <span className="internal-chats__bubble-sender">{senderName}</span>
                      )}
                      <p>{text}</p>
                      {createdAt && (
                        <time className="dashboard-bubble__time">
                          {formatMessageTime(createdAt)}
                        </time>
                      )}
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="dashboard-chat__input" onSubmit={handleSend}>
              <input
                type="text"
                className="dashboard-chat__field"
                placeholder="შინაგანი მესიჯი..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
                maxLength={MAX_MESSAGE_LENGTH}
              />
              <button
                type="submit"
                className="btn btn--primary dashboard-chat__send internal-chats__send"
                disabled={!input.trim() || sending}
                aria-label="გაგზავნა"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  )
}

export default InternalChatsPanel
