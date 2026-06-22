import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive, ClipboardList, Home, ListChecks, LogOut, RefreshCw, Save, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  formatDeveloperRating,
  formatOrderAmount,
  formatOrderDate,
  formatOrderNoteTime,
  getDeveloperOrderStats,
  getDeveloperPayoutStats,
  ORDER_PRIORITY_LABELS,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  PAYOUT_STATUS_LABELS,
  partitionDeveloperOrders,
  resolvePayoutStatus,
  subscribeToDeveloperOrders,
  subscribeToOrder,
  updateDeveloperOrderStatus,
} from '../services/orderService'
import { updateDeveloperProfile } from '../services/userService'
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

function DeveloperProfilePanel({ user, userProfile, onError }) {
  const [bio, setBio] = useState(userProfile?.bio || '')
  const [skills, setSkills] = useState((userProfile?.skills || []).join(', '))
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateDeveloperProfile(user.uid, {
        bio: bio.trim(),
        skills: skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      })
    } catch (err) {
      onError(err.message || 'პროფილის შენახვა ვერ მოხერხდა.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dev-profile">
      <div className="dev-profile__header">
        <User size={40} className="dev-profile__avatar" />
        <div>
          <h2>{userProfile?.name || 'შემსრულებელი'}</h2>
          <p className="dev-profile__rating">{formatDeveloperRating(userProfile)}</p>
        </div>
      </div>
      <form className="dev-profile__form" onSubmit={handleSave}>
        <label className="dev-profile__field">
          <span>ჩემს შესახებ</span>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="გამოცდილება, სპეციალიზაცია..."
            disabled={saving}
          />
        </label>
        <label className="dev-profile__field">
          <span>უნარები (მძიმით გამოყოფილი)</span>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="React, Windows, ქსელი..."
            disabled={saving}
          />
        </label>
        <button type="submit" className="btn btn--primary btn--sm" disabled={saving}>
          <Save size={16} />
          პროფილის შენახვა
        </button>
      </form>
    </div>
  )
}

function DeveloperOrderDetail({ orderId, onError, onMissing }) {
  const [order, setOrder] = useState(null)
  const [orderLoaded, setOrderLoaded] = useState(false)
  const [statusValue, setStatusValue] = useState('')
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
    return <div className="dev-detail__empty">შეკვეთა აღარ არსებობს.</div>
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
        <p className="dev-detail__priority">
          პრიორიტეტი: {ORDER_PRIORITY_LABELS[order.priority] ?? '—'}
        </p>
        <h3 className="dev-detail__section-title">აღწერა</h3>
        <p className="dev-detail__description">{order.description}</p>
        <p className="dev-detail__meta">შექმნილია: {formatOrderDate(order.createdAt)}</p>
      </section>

      <section className="dev-detail__section">
        <h3 className="dev-detail__section-title">ანაზღაურება</h3>
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
    </div>
  )
}

function DeveloperDashboard() {
  usePageMeta(pageTitle('ჩემი შეკვეთები'), 'DIGIT — შემსრულებლის პანელი.')

  const { user, userProfile, logout } = useAuth()
  const [mainTab, setMainTab] = useState('orders')
  const [tab, setTab] = useState('active')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [error, setError] = useState('')

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

  return (
    <div className="dashboard dev-dashboard">
      <header className="dashboard-header dev-dashboard__header">
        <div className="dashboard-header__brand">
          <span className="dashboard-header__badge dev-dashboard__badge">Executor</span>
          <h1 className="dashboard-header__title">შემსრულებლის პანელი</h1>
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
              className={`dashboard-main-tab ${mainTab === 'profile' ? 'dashboard-main-tab--active' : ''}`}
              onClick={() => setMainTab('profile')}
            >
              <User size={16} />
              პროფილი
            </button>
          </div>
          <Link to="/" className="dashboard-header__link">
            <Home size={18} />
            საიტზე დაბრუნება
          </Link>
          <button type="button" className="dashboard-header__link" onClick={logout}>
            <LogOut size={18} />
            გასვლა
          </button>
        </div>
      </header>

      {error && <div className="dashboard-error">{error}</div>}

      {mainTab === 'profile' ? (
        <div className="dev-dashboard__profile-wrap">
          <DeveloperProfilePanel user={user} userProfile={userProfile} onError={setError} />
        </div>
      ) : (
        <>
          <div className="dev-dashboard__stats">
            <article className="dev-stat-card">
              <ClipboardList size={22} className="dev-stat-card__icon" />
              <div>
                <span className="dev-stat-card__value">{stats.activeCount}</span>
                <span className="dev-stat-card__label">აქტიური</span>
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
                <span className="dev-stat-card__label">მისაღები</span>
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
                    {tab === 'active' ? 'აქტიური შეკვეთები არ გაქვს.' : 'დასრულებული შეკვეთები არ არის.'}
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
                      <p className="dev-order-card__service">{order.serviceType}</p>
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
                  onError={setError}
                  onMissing={handleOrderMissing}
                />
              )}
            </main>
          </div>
        </>
      )}
    </div>
  )
}

export default DeveloperDashboard
