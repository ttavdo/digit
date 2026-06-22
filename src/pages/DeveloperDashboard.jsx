import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Home, LogOut, MessageSquare, RefreshCw, Users, ListChecks, Archive } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import InternalChatsPanel from '../components/internal/InternalChatsPanel'
import OrderConversationChat from '../components/orders/OrderConversationChat'
import { useInternalChatUnreadCount } from '../hooks/useInternalChatUnread'
import {
  formatOrderAmount,
  formatOrderDate,
  formatOrderNoteTime,
  getDeveloperOrderStats,
  getDeveloperPayoutStats,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  PAYOUT_STATUS_LABELS,
  partitionDeveloperOrders,
  resolvePayoutStatus,
  subscribeToDeveloperOrders,
  subscribeToOrder,
  updateDeveloperOrderStatus,
} from '../services/orderService'
import usePageMeta from '../hooks/usePageMeta'
import { pageTitle } from '../constants/brand'
import './DeveloperDashboard.css'
import './Dashboard.css'

const DEVELOPER_STATUS_OPTIONS = [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.COMPLETED]

function DeveloperPayoutBadge({ order }) {
  if (order.developerPayout == null || order.developerPayout <= 0) return null
  const status = resolvePayoutStatus(order)
  return (
    <span className={`comp-badge comp-badge--payout-${status}`}>
      {PAYOUT_STATUS_LABELS[status]}
    </span>
  )
}

function DeveloperOrderDetail({ orderId, user, onError, onMissing }) {
  const [order, setOrder] = useState(null)
  const [orderLoaded, setOrderLoaded] = useState(false)
  const [statusValue, setStatusValue] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!orderId) return undefined

    const unsubscribe = subscribeToOrder(
      orderId,
      (data) => {
        setOrder(data)
        setOrderLoaded(true)
        if (!data) {
          onMissing?.()
          return
        }
        setStatusValue(data.status ?? '')
      },
      (err) => onError(err.message || 'შეკვეთის ჩატვირთვა ვერ მოხერხდა.'),
    )

    return unsubscribe
  }, [orderId, onError, onMissing])

  const handleStatusUpdate = async () => {
    if (!orderId || !statusValue || statusValue === order?.status) return

    setSubmitting(true)
    try {
      await updateDeveloperOrderStatus(orderId, statusValue)
    } catch (err) {
      onError(err.message || 'სტატუსის განახლება ვერ მოხერხდა.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!orderLoaded) {
    return <div className="dev-detail__empty">იტვირთება...</div>
  }

  if (!order) {
    return (
      <div className="dev-detail__empty">
        შეკვეთა აღარ არსებობს ან მოხსნილია მინიჭებიდან.
      </div>
    )
  }

  const notes = [...(order.managerNotes || [])].reverse()

  return (
    <div className="dev-detail">
      <div className="dev-detail__header">
        <div>
          <h2 className="dev-detail__title">{order.customerName}</h2>
          <p className="dev-detail__meta">{order.serviceType}</p>
        </div>
        <span className={`order-badge order-badge--${order.status}`}>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <section className="dev-detail__section">
        <h3 className="dev-detail__section-title">აღწერა</h3>
        <p className="dev-detail__description">{order.description}</p>
        <p className="dev-detail__meta">შექმნილია: {formatOrderDate(order.createdAt)}</p>
      </section>

      <section className="dev-detail__section">
        <h3 className="dev-detail__section-title">ანაზღაურება</h3>
        {/* TODO: ნამდვილი გადახდის ინტეგრაცია (Stripe ან მსგავსი) მომავალში — მენეჯერი ხელით აღნიშნავს payoutStatus-ს. */}
        {order.developerPayout != null && order.developerPayout > 0 ? (
          <div className="dev-detail__payout">
            <span className="dev-detail__payout-amount">
              {formatOrderAmount(order.developerPayout)}
            </span>
            <DeveloperPayoutBadge order={order} />
          </div>
        ) : (
          <p className="dev-detail__empty-text">ანაზღაურება ჯერ არ არის დაფიქსირებული.</p>
        )}
      </section>

      <section className="dev-detail__section">
        <h3 className="dev-detail__section-title">მენეჯერის შენიშვნები</h3>
        {notes.length === 0 ? (
          <p className="dev-detail__empty-text">შენიშვნები არ არის.</p>
        ) : (
          <ul className="dev-notes">
            {notes.map((note, index) => (
              <li key={`${note.createdAt?.seconds ?? index}-${index}`} className="dev-note">
                <p>{note.text}</p>
                <span>
                  {note.authorName} · {formatOrderNoteTime(note.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dev-detail__section">
        <h3 className="dev-detail__section-title">სტატუსის განახლება</h3>
        <div className="dev-detail__row">
          <select
            className="dev-detail__select"
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
            disabled={submitting || order.status === ORDER_STATUS.CANCELLED}
          >
            <option value={ORDER_STATUS.ASSIGNED}>{ORDER_STATUS_LABELS.assigned}</option>
            {DEVELOPER_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={handleStatusUpdate}
            disabled={
              submitting ||
              statusValue === order.status ||
              order.status === ORDER_STATUS.CANCELLED
            }
          >
            <RefreshCw size={16} />
            განახლება
          </button>
        </div>
      </section>

      <section className="dev-detail__section">
        <div className="dev-detail__row dev-detail__row--between">
          <h3 className="dev-detail__section-title">მომხმარებელთან საუბარი</h3>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => setShowChat((prev) => !prev)}
          >
            <MessageSquare size={16} />
            {showChat ? 'ჩატის დამალვა' : 'მომხმარებელთან საუბარი'}
          </button>
        </div>

        {showChat && (
          <OrderConversationChat
            key={order.conversationId}
            conversationId={order.conversationId}
            userId={user.uid}
            customerName={order.customerName}
          />
        )}
      </section>
    </div>
  )
}

function DeveloperDashboard() {
  usePageMeta(pageTitle('ჩემი შეკვეთები'), 'DIGIT — დეველოპერის პანელი.')

  const { user, userProfile, logout } = useAuth()
  const [mainTab, setMainTab] = useState('orders')
  const [tab, setTab] = useState('active')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [error, setError] = useState('')
  const internalUnread = useInternalChatUnreadCount(user?.uid, userProfile?.role)

  const handleOrderMissing = useCallback(() => {
    setSelectedOrderId(null)
  }, [])

  useEffect(() => {
    if (!user?.uid) return undefined

    const unsubscribe = subscribeToDeveloperOrders(
      user.uid,
      (list) => {
        setOrders(list)
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'შეკვეთების ჩატვირთვა ვერ მოხერხდა.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user?.uid])

  const { active, archived } = useMemo(() => partitionDeveloperOrders(orders), [orders])
  const stats = useMemo(() => getDeveloperOrderStats(orders), [orders])
  const payoutStats = useMemo(() => getDeveloperPayoutStats(orders), [orders])
  const visibleOrders = tab === 'active' ? active : archived
  const selectedOrderIdResolved =
    selectedOrderId && visibleOrders.some((order) => order.id === selectedOrderId)
      ? selectedOrderId
      : visibleOrders[0]?.id ?? null

  const handleTabChange = (nextTab) => {
    setTab(nextTab)
    const pool = nextTab === 'active' ? active : archived
    setSelectedOrderId(pool[0]?.id ?? null)
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="dashboard dev-dashboard">
      <header className="dashboard-header dev-dashboard__header">
        <div className="dashboard-header__brand">
          <span className="dashboard-header__badge dev-dashboard__badge">Developer</span>
          <h1 className="dashboard-header__title">დეველოპერის პანელი</h1>
        </div>
        <div className="dashboard-header__actions">
          <div className="dashboard-main-tabs">
            <button
              type="button"
              className={`dashboard-main-tab ${mainTab === 'orders' ? 'dashboard-main-tab--active' : ''}`}
              onClick={() => setMainTab('orders')}
            >
              <ClipboardList size={16} />
              ჩემი შეკვეთები
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
          </div>
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

      {mainTab === 'internal' ? (
        <div className="dev-dashboard__internal">
          <InternalChatsPanel
            user={user}
            userProfile={userProfile}
            onError={setError}
          />
        </div>
      ) : (
        <>
      <div className="dev-dashboard__stats">
        <article className="dev-stat-card">
          <ClipboardList size={22} className="dev-stat-card__icon" />
          <div>
            <span className="dev-stat-card__value">{stats.activeCount}</span>
            <span className="dev-stat-card__label">აქტიური შეკვეთები</span>
          </div>
        </article>
        <article className="dev-stat-card">
          <ClipboardList size={22} className="dev-stat-card__icon dev-stat-card__icon--green" />
          <div>
            <span className="dev-stat-card__value">{stats.completedThisMonth}</span>
            <span className="dev-stat-card__label">დასრულებული ამ თვეში</span>
          </div>
        </article>
        <article className="dev-stat-card dev-stat-card--payout">
          <ClipboardList size={22} className="dev-stat-card__icon dev-stat-card__icon--amber" />
          <div>
            <span className="dev-stat-card__value">
              {formatOrderAmount(payoutStats.pendingTotal)}
            </span>
            <span className="dev-stat-card__label">მისაღები თანხა</span>
          </div>
        </article>
        <article className="dev-stat-card dev-stat-card--payout">
          <ClipboardList size={22} className="dev-stat-card__icon dev-stat-card__icon--green" />
          <div>
            <span className="dev-stat-card__value">
              {formatOrderAmount(payoutStats.paidTotal)}
            </span>
            <span className="dev-stat-card__label">
              მიღებული თანხა (სულ · ამ თვეში {formatOrderAmount(payoutStats.paidThisMonth)})
            </span>
          </div>
        </article>
      </div>

      <div className="dev-dashboard__body">
        <aside className="dev-dashboard__sidebar">
          <div className="dashboard-filters">
            <button
              type="button"
              className={`dashboard-filter ${tab === 'active' ? 'dashboard-filter--active' : ''}`}
              onClick={() => handleTabChange('active')}
            >
              <ListChecks size={14} />
              აქტიური ({active.length})
            </button>
            <button
              type="button"
              className={`dashboard-filter ${tab === 'archived' ? 'dashboard-filter--active' : ''}`}
              onClick={() => handleTabChange('archived')}
            >
              <Archive size={14} />
              დასრულებული ({archived.length})
            </button>
          </div>

          <div className="dev-dashboard__list">
            {loading ? (
              <p className="dashboard-list__empty">იტვირთება...</p>
            ) : visibleOrders.length === 0 ? (
              <p className="dashboard-list__empty">
                {tab === 'active'
                  ? 'აქტიური შეკვეთები არ გაქვს.'
                  : 'დასრულებული შეკვეთები არ არის.'}
              </p>
            ) : (
              visibleOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={`dev-order-card ${selectedOrderIdResolved === order.id ? 'dev-order-card--active' : ''}`}
                  onClick={() => {
                    setSelectedOrderId(order.id)
                    setError('')
                  }}
                >
                  <div className="dev-order-card__top">
                    <span className="dev-order-card__name">{order.customerName}</span>
                    <span className={`order-badge order-badge--${order.status}`}>
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>
                  {(order.developerPayout != null && order.developerPayout > 0) && (
                    <div className="dev-order-card__payout">
                      <span>{formatOrderAmount(order.developerPayout)}</span>
                      <DeveloperPayoutBadge order={order} />
                    </div>
                  )}
                  <p className="dev-order-card__service">{order.serviceType}</p>
                  <p className="dev-order-card__description">{order.description}</p>
                  <span className="dev-order-card__date">{formatOrderDate(order.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="dev-dashboard__main">
          {!selectedOrderIdResolved ? (
            <div className="dev-detail__empty">აირჩიეთ შეკვეთა სიიდან</div>
          ) : (
            <DeveloperOrderDetail
              key={selectedOrderIdResolved}
              orderId={selectedOrderIdResolved}
              user={user}
              onError={setError}
              onMissing={handleOrderMissing}
            />
          )}
        </main>
      </div>

      <p className="dev-dashboard__hint">
        ეს პანელი მხოლოდ შენზე მიკუთვნებულ შეკვეთებს აჩვენებს — სხვა დეველოპერების ან მენეჯერის სრული
        სია აქ არ ჩანს.
      </p>
        </>
      )}
    </div>
  )
}

export default DeveloperDashboard
