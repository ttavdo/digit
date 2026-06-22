import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, Phone, Mail, Clock, User, Code2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import FirebaseSetupNotice from '../components/FirebaseSetupNotice'
import Reveal from '../components/Reveal'
import usePageMeta from '../hooks/usePageMeta'
import { CONTACT_EMAIL, pageTitle } from '../constants/brand'
import { getServiceById } from '../data/services'
import {
  findOrCreateOpenConversation,
  formatMessageTime,
  sendCustomerMessage,
  subscribeToMessages,
} from '../services/chatService'
import { MAX_MESSAGE_LENGTH, validateMessageLength } from '../utils/validation'
import './Contact.css'

const EMPTY_ARRAY = []

const TABS = {
  manager: {
    id: 'manager',
    label: 'მენეჯერთან საუბარი',
    icon: User,
    name: 'გიორგი — მენეჯერი',
    status: 'ონლაინ',
    emptyHint: 'დაწერეთ შეტყობინება — მენეჯერი მალე გიპასუხებთ.',
  },
  developer: {
    id: 'developer',
    label: 'უშუალოდ ჩემთან (დეველოპერთან) საუბარი',
    icon: Code2,
    name: 'ნიკა — დეველოპერი',
    status: 'ონლაინ',
    emptyHint: 'დაწერეთ შეტყობინება — დეველოპერი მალე გიპასუხებთ.',
  },
}

function Contact() {
  usePageMeta(
    pageTitle('დაკავშირება'),
    'DIGIT — დაკავშირდით მენეჯერთან ან ადმინისტრაციასთან. ჩატი, ელ. ფოსტა და ტელეფონი.'
  )

  const { user, userProfile, isFirebaseConfigured } = useAuth()
  const [searchParams] = useSearchParams()
  const serviceId = searchParams.get('service')
  const selectedService = serviceId ? getServiceById(serviceId) : null

  const [activeTab, setActiveTab] = useState('manager')
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadedChatKey, setLoadedChatKey] = useState('')
  const [chatError, setChatError] = useState('')

  const messagesEndRef = useRef(null)

  const tab = TABS[activeTab]
  const customerName = useMemo(
    () =>
      userProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'მომხმარებელი',
    [userProfile?.name, user?.displayName, user?.email],
  )

  const currentChatKey = user ? `${user.uid}_${activeTab}_${serviceId || ''}` : ''
  const displayConversationId = loadedChatKey === currentChatKey ? conversationId : null
  const displayMessages = loadedChatKey === currentChatKey ? messages : EMPTY_ARRAY
  const loadingMessages = !!user && isFirebaseConfigured && loadedChatKey !== currentChatKey

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!user || !isFirebaseConfigured) {
      return undefined
    }

    let unsubscribeMessages = () => {}
    let cancelled = false

    async function initChat() {
      try {
        const convId = await findOrCreateOpenConversation({
          customerId: user.uid,
          customerName,
          type: activeTab,
          serviceRequested: serviceId,
        })

        if (cancelled) return

        setConversationId(convId)

        unsubscribeMessages = subscribeToMessages(
          convId,
          (firestoreMessages) => {
            if (cancelled) return
            setMessages(firestoreMessages)
            setLoadedChatKey(currentChatKey)
          },
          (error) => {
            console.error('Chat subscription error:', error)
            if (!cancelled) {
              setChatError('ჩატის ჩატვირთვა ვერ მოხერხდა. სცადეთ გვერდის განახლება.')
              setLoadedChatKey(currentChatKey)
            }
          },
        )
      } catch (error) {
        console.error('Chat init error:', error)
        if (!cancelled) {
          setChatError('ჩატის დაწყება ვერ მოხერხდა.')
          setLoadedChatKey(currentChatKey)
        }
      }
    }

    initChat()

    return () => {
      cancelled = true
      unsubscribeMessages()
    }
  }, [user, customerName, activeTab, serviceId, isFirebaseConfigured, currentChatKey])

  useEffect(() => {
    scrollToBottom()
  }, [displayMessages, scrollToBottom])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    const lengthError = validateMessageLength(text)
    if (!text || sending || !displayConversationId || !user || lengthError) {
      if (lengthError) setChatError(lengthError)
      return
    }

    setChatError('')
    setInput('')
    setSending(true)

    try {
      await sendCustomerMessage(displayConversationId, {
        senderId: user.uid,
        text,
      })
    } catch (error) {
      console.error('Send message error:', error)
      setChatError('მესიჯის გაგზავნა ვერ მოხერხდა.')
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  const handleTabChange = (tabId) => {
    if (tabId === activeTab || sending) return
    setActiveTab(tabId)
    setConversationId(null)
    setMessages([])
    setLoadedChatKey('')
    setInput('')
    setChatError('')
  }

  const emptyHint = selectedService
    ? `${tab.emptyHint} (სერვისი: ${selectedService.title})`
    : tab.emptyHint

  return (
    <>
      <section className="page-hero page-hero--compact">
        <div className="container">
          <Reveal variant="fade">
            <span className="relay-line" />
            <h1 className="page__title">დაკავშირება</h1>
            <p className="page__subtitle">
              აირჩიეთ ვისთან გსურთ საუბარი — DIGIT მენეჯერი პროცესს ხელში აიღებს.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="page contact-page">
        <div className="container">
        {chatError && <div className="contact-page__error">{chatError}</div>}
        {!isFirebaseConfigured && (
          <div className="container" style={{ marginBottom: '1rem' }}>
            <FirebaseSetupNotice />
          </div>
        )}

        <div className="contact-layout">
          <aside className="contact-sidebar">
            <div className="contact-tabs" role="tablist" aria-label="ჩატის არჩევანი">
              {Object.values(TABS).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === id}
                  className={`contact-tab ${activeTab === id ? 'contact-tab--active' : ''}`}
                  onClick={() => handleTabChange(id)}
                  disabled={sending || loadingMessages}
                >
                  <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="contact-info">
              <h2 className="contact-info__title">სხვა გზით დაკავშირება</h2>
              <p className="contact-info__desc">
                თუ ჩატი არ გირჩევნიათ, დაგვიკავშირდით პირდაპირ:
              </p>
              <ul className="contact-info__list">
                <li>
                  <Phone size={18} aria-hidden="true" />
                  <div>
                    <span className="contact-info__label">ტელეფონი</span>
                    <a href="tel:+995555123456">+995 555 123 456</a>
                  </div>
                </li>
                <li>
                  <Mail size={18} aria-hidden="true" />
                  <div>
                    <span className="contact-info__label">ელ. ფოსტა</span>
                    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                  </div>
                </li>
                <li>
                  <Clock size={18} aria-hidden="true" />
                  <div>
                    <span className="contact-info__label">სამუშაო საათები</span>
                    <span>ორშ–პარ, 10:00 – 19:00</span>
                  </div>
                </li>
              </ul>
            </div>
          </aside>

          <div className="chat-window" role="tabpanel">
            <div className="chat-window__header">
              <div className="chat-window__avatar" aria-hidden="true">
                {activeTab === 'manager' ? 'GM' : 'NK'}
              </div>
              <div>
                <h2 className="chat-window__name">{tab.name}</h2>
                <span className="chat-window__status">
                  <span className="chat-window__status-dot" />
                  {tab.status}
                </span>
              </div>
            </div>

            <div className="chat-messages" aria-live="polite">
              {loadingMessages ? (
                <div className="chat-messages__loading">ჩატი იტვირთება...</div>
              ) : displayMessages.length === 0 ? (
                <div className="chat-messages__empty">
                  <p>{emptyHint}</p>
                </div>
              ) : (
                displayMessages.map(({ id, text, senderRole, createdAt }) => (
                  <div
                    key={id}
                    className={`chat-bubble chat-bubble--${senderRole === 'customer' ? 'user' : 'bot'}`}
                  >
                    <p>{text}</p>
                    {createdAt && (
                      <time className="chat-bubble__time" dateTime={createdAt.toDate?.()?.toISOString()}>
                        {formatMessageTime(createdAt)}
                      </time>
                    )}
                  </div>
                ))
              )}

              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input" onSubmit={handleSend}>
              <input
                type="text"
                className="chat-input__field"
                placeholder="დაწერე შეტყობინება..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending || loadingMessages || !displayConversationId || !isFirebaseConfigured}
                maxLength={MAX_MESSAGE_LENGTH}
                aria-label="შეტყობინება"
              />
              <button
                type="submit"
                className="chat-input__send btn btn--primary"
                disabled={!input.trim() || sending || loadingMessages || !displayConversationId || !isFirebaseConfigured}
                aria-label="გაგზავნა"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}

export default Contact
