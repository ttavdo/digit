import { useCallback, useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import {
  formatMessageTime,
  sendStaffMessage,
  subscribeToMessages,
} from '../../services/chatService'
import { MAX_MESSAGE_LENGTH, validateMessageLength } from '../../utils/validation'
import './OrderConversationChat.css'

function OrderConversationChat({ conversationId, userId, customerName }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!conversationId) return undefined

    const unsubscribe = subscribeToMessages(
      conversationId,
      (list) => {
        setMessages(list)
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'ჩატის ჩატვირთვა ვერ მოხერხდა.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    const lengthError = validateMessageLength(text)
    if (!text || !conversationId || !userId || sending || lengthError) {
      if (lengthError) setError(lengthError)
      return
    }

    setSending(true)
    setError('')

    try {
      await sendStaffMessage(conversationId, {
        senderId: userId,
        senderRole: 'developer',
        text,
      })
      setInput('')
    } catch (err) {
      setError(err.message || 'მესიჯის გაგზავნა ვერ მოხერხდა.')
    } finally {
      setSending(false)
    }
  }

  if (!conversationId) {
    return <p className="order-chat__empty">საუბრის ID არ მოიძებნა.</p>
  }

  return (
    <div className="order-chat">
      <div className="order-chat__header">
        <h3 className="order-chat__title">საუბარი: {customerName}</h3>
      </div>

      {error && <div className="order-chat__error">{error}</div>}

      <div className="order-chat__messages">
        {loading ? (
          <p className="order-chat__empty">მესიჯები იტვირთება...</p>
        ) : messages.length === 0 ? (
          <p className="order-chat__empty">მესიჯები ჯერ არ არის. დაიწყე საუბარი მომხმარებელთან.</p>
        ) : (
          messages.map(({ id, text, senderRole, createdAt }) => (
            <div
              key={id}
              className={`order-chat__bubble order-chat__bubble--${senderRole === 'customer' ? 'customer' : 'staff'}`}
            >
              <p>{text}</p>
              {createdAt && (
                <time className="order-chat__time">{formatMessageTime(createdAt)}</time>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="order-chat__input" onSubmit={handleSend}>
        <input
          type="text"
          className="order-chat__field"
          placeholder="დაწერე მომხმარებელს..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          maxLength={MAX_MESSAGE_LENGTH}
        />
        <button
          type="submit"
          className="btn btn--primary order-chat__send"
          disabled={!input.trim() || sending}
          aria-label="გაგზავნა"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}

export default OrderConversationChat
