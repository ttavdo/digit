import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, LogOut, Home, MessageSquare, Plus, Send, Users, XCircle, MessageCircle, Archive } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import InternalChatsPanel from '../components/internal/InternalChatsPanel'
import CreateOrderModal from '../components/orders/CreateOrderModal'
import ManagerOrdersPanel from '../components/orders/ManagerOrdersPanel'
import { useInternalChatUnreadCount } from '../hooks/useInternalChatUnread'
import {
  closeConversation,
  formatMessageTime,
  formatRelativeTime,
  sendStaffMessage,
  subscribeToConversations,
  subscribeToMessages,
} from '../services/chatService'
import { getServiceById } from '../data/services'
import { isManagerRole } from '../utils/roles'
import { MAX_MESSAGE_LENGTH, validateMessageLength } from '../utils/validation'
import usePageMeta from '../hooks/usePageMeta'
import { pageTitle } from '../constants/brand'
import './Dashboard.css'

const EMPTY_ARRAY = []

const ROLE_LABELS = {
  manager: 'მენეჯერის პანელი',
}

function Dashboard({ initialTab = 'chats' }) {
  usePageMeta(pageTitle('Dashboard'), 'DIGIT — მენეჯერის პანელი.')

  const { user, userProfile, logout } = useAuth()
  const role = userProfile?.role
  const isManager = isManagerRole(role)

  const [mainTab, setMainTab] = useState(initialTab)
  const [statusFilter, setStatusFilter] = useState('open')
  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadedId, setLoadedId] = useState(null)
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState('')
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [focusOrderId, setFocusOrderId] = useState(null)
  const internalUnread = useInternalChatUnreadCount(user?.uid, userProfile?.role)

  const messagesEndRef = useRef(null)
  const selectedConversation = conversations.find((c) => c.id === selectedId)

  const displayMessages = selectedId && loadedId === selectedId ? messages : EMPTY_ARRAY
  const loadingMessages = !!selectedId && loadedId !== selectedId

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleError = useCallback((message) => {
    setError(message)
  }, [])

  const handleStatusFilterChange = (filter) => {
    setStatusFilter(filter)
    setLoadingList(true)
    setError('')
  }

  useEffect(() => {
    if (!role) return undefined

    const unsubscribe = subscribeToConversations(
      role,
      statusFilter,
      (list) => {
        setConversations(list)
        setLoadingList(false)
        setError('')
        setSelectedId((prev) => {
          if (prev && list.some((c) => c.id === prev)) return prev
          return list[0]?.id ?? null
        })
      },
      (err) => {
        console.error('Conversations subscription error:', err)
        setError('საუბრების ჩატვირთვა ვერ მოხერხდა.')
        setLoadingList(false)
      },
    )

    return unsubscribe
  }, [role, statusFilter])

  useEffect(() => {
    if (!selectedId) {
      return undefined
    }

    const unsubscribe = subscribeToMessages(
      selectedId,
      (list) => {
        setMessages(list)
        setLoadedId(selectedId)
      },
      (err) => {
        console.error('Messages subscription error:', err)
        setError('მესიჯების ჩატვირთვა ვერ მოხერხდა.')
        setLoadedId(selectedId)
      },
    )

    return unsubscribe
  }, [selectedId])

  useEffect(() => {
    scrollToBottom()
  }, [displayMessages, scrollToBottom])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    const lengthError = validateMessageLength(text)
    if (!text || !selectedId || !user || !role || sending || lengthError) {
      if (lengthError) setError(lengthError)
      return
    }

    setSending(true)
    setError('')

    try {
      await sendStaffMessage(selectedId, {
        senderId: user.uid,
        senderRole: role,
        text,
      })
      setInput('')
    } catch (err) {
      console.error('Send error:', err)
      setError('პასუხის გაგზავნა ვერ მოხერხდა.')
    } finally {
      setSending(false)
    }
  }

  const handleClose = async () => {
    if (!selectedId || closing || selectedConversation?.status === 'closed') return

    setClosing(true)
    setError('')

    try {
      await closeConversation(selectedId)
      setSelectedId(null)
    } catch (err) {
      console.error('Close error:', err)
      setError('საუბრის დახურვა ვერ მოხერხდა.')
    } finally {
      setClosing(false)
    }
  }

  const handleOrderCreated = (orderId) => {
    setFocusOrderId(orderId)
    setMainTab('orders')
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header__brand">
          <span className="dashboard-header__badge">Admin</span>
          <h1 className="dashboard-header__title">{ROLE_LABELS[role] ?? 'Dashboard'}</h1>
        </div>
        <div className="dashboard-header__actions">
          {isManager && (
            <div className="dashboard-main-tabs">
              <button
                type="button"
                className={`dashboard-main-tab ${mainTab === 'chats' ? 'dashboard-main-tab--active' : ''}`}
                onClick={() => setMainTab('chats')}
              >
                <MessageSquare size={16} />
                მომხმარებლის საუბრები
              </button>
              <button
                type="button"
                className={`dashboard-main-tab ${mainTab === 'internal' ? 'dashboard-main-tab--active' : ''}`}
                onClick={() => setMainTab('internal')}
              >
                <Users size={16} />
                შინაგანი საუბრები
                {internalUnread > 0 && (
                  <span className="dashboard-main-tab__badge">{internalUnread}</span>
                )}
              </button>
              <button
                type="button"
                className={`dashboard-main-tab ${mainTab === 'orders' ? 'dashboard-main-tab--active' : ''}`}
                onClick={() => setMainTab('orders')}
              >
                <ClipboardList size={16} />
                შეკვეთები
              </button>
            </div>
          )}
          <Link to="/" className="dashboard-header__link">
            <Home size={18} />
            საიტზე დაბრუნება
          </Link>
          <button type="button" className="dashboard-header__link" onClick={handleLogout}>
            <LogOut size={18} />
            გასვლა
          </button>
        </div>
      </header>

      {error && <div className="dashboard-error">{error}</div>}

      {isManager && mainTab === 'orders' ? (
        <ManagerOrdersPanel
          managerName={userProfile?.name || user?.email || 'მენეჯერი'}
          initialOrderId={focusOrderId}
          onError={handleError}
        />
      ) : isManager && mainTab === 'internal' ? (
        <div className="dashboard-internal">
          <InternalChatsPanel
            user={user}
            userProfile={userProfile}
            onError={handleError}
          />
        </div>
      ) : (
        <div className="dashboard-body">
          <aside className="dashboard-sidebar">
            <div className="dashboard-filters">
              <button
                type="button"
                className={`dashboard-filter ${statusFilter === 'open' ? 'dashboard-filter--active' : ''}`}
                onClick={() => handleStatusFilterChange('open')}
              >
                <MessageCircle size={14} />
                ღია საუბრები
              </button>
              <button
                type="button"
                className={`dashboard-filter ${statusFilter === 'closed' ? 'dashboard-filter--active' : ''}`}
                onClick={() => handleStatusFilterChange('closed')}
              >
                <Archive size={14} />
                დახურული საუბრები
              </button>
            </div>

            <div className="dashboard-list">
              {loadingList ? (
                <p className="dashboard-list__empty">იტვირთება...</p>
              ) : conversations.length === 0 ? (
                <p className="dashboard-list__empty">
                  {statusFilter === 'open' ? 'ღია საუბრები არ არის.' : 'დახურული საუბრები არ არის.'}
                </p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    className={`dashboard-conv ${selectedId === conv.id ? 'dashboard-conv--active' : ''}`}
                    onClick={() => {
                      setSelectedId(conv.id)
                      setError('')
                    }}
                  >
                    <div className="dashboard-conv__top">
                      <span className="dashboard-conv__name">{conv.customerName}</span>
                      <span className={`dashboard-conv__status dashboard-conv__status--${conv.status}`}>
                        {conv.status === 'open' ? 'ღია' : 'დახურული'}
                      </span>
                    </div>
                    <p className="dashboard-conv__preview">
                      {conv.lastMessageText || 'მესიჯები არ არის'}
                    </p>
                    <span className="dashboard-conv__time">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          <main className="dashboard-chat">
            {!selectedId ? (
              <div className="dashboard-chat__placeholder">
                <p>აირჩიეთ საუბარი სიიდან</p>
              </div>
            ) : (
              <>
                <div className="dashboard-chat__header">
                  <div>
                    <h2 className="dashboard-chat__title">{selectedConversation?.customerName}</h2>
                    {selectedConversation?.serviceRequested && (
                      <p className="dashboard-chat__meta">
                        სერვისი:{' '}
                        {getServiceById(selectedConversation.serviceRequested)?.title ??
                          selectedConversation.serviceRequested}
                      </p>
                    )}
                  </div>
                  <div className="dashboard-chat__header-actions">
                    {isManager && selectedConversation?.status === 'open' && (
                      <button
                        type="button"
                        className="dashboard-chat__order-btn"
                        onClick={() => setShowCreateOrder(true)}
                      >
                        <Plus size={18} />
                        შეკვეთის შექმნა
                      </button>
                    )}
                    {selectedConversation?.status === 'open' && (
                      <button
                        type="button"
                        className="dashboard-chat__close-btn"
                        onClick={handleClose}
                        disabled={closing}
                      >
                        <XCircle size={18} />
                        {closing ? 'იხურება...' : 'საუბრის დახურვა'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="dashboard-chat__messages">
                  {loadingMessages ? (
                    <p className="dashboard-chat__loading">მესიჯები იტვირთება...</p>
                  ) : displayMessages.length === 0 ? (
                    <p className="dashboard-chat__loading">მესიჯები ჯერ არ არის.</p>
                  ) : (
                    displayMessages.map(({ id, text, senderRole, createdAt }) => (
                      <div
                        key={id}
                        className={`dashboard-bubble dashboard-bubble--${senderRole === 'customer' ? 'customer' : 'staff'}`}
                      >
                        <p>{text}</p>
                        {createdAt && (
                          <time className="dashboard-bubble__time">
                            {formatMessageTime(createdAt)}
                          </time>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {selectedConversation?.status === 'open' ? (
                  <form className="dashboard-chat__input" onSubmit={handleSend}>
                    <input
                      type="text"
                      className="dashboard-chat__field"
                      placeholder="დაწერე პასუხი..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={sending}
                      maxLength={MAX_MESSAGE_LENGTH}
                    />
                    <button
                      type="submit"
                      className="btn btn--primary dashboard-chat__send"
                      disabled={!input.trim() || sending}
                      aria-label="გაგზავნა"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                ) : (
                  <div className="dashboard-chat__closed-notice">
                    ეს საუბარი დახურულია.
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      )}

      {showCreateOrder && selectedConversation && (
        <CreateOrderModal
          conversation={selectedConversation}
          onClose={() => setShowCreateOrder(false)}
          onCreated={handleOrderCreated}
        />
      )}
    </div>
  )
}

export default Dashboard
