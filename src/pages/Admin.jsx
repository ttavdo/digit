import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CheckCircle2, LayoutDashboard, Loader2, LogOut, ShieldCheck, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import FirebaseSetupNotice from '../components/FirebaseSetupNotice'
import DeveloperCvSummary from '../components/DeveloperCvSummary'
import {
  approveDeveloperRequest,
  rejectDeveloperRequest,
  subscribeToPendingDeveloperRequests,
} from '../services/adminService'
import {
  getAuthErrorMessage,
  validateEmail,
  validatePassword,
} from '../utils/authErrors'
import {
  DEVELOPER_REQUEST_STATUS,
  isManagerRole,
  isStaffRole,
} from '../utils/roles'
import { ensureAdminAccount } from '../utils/ensureAdminAccount'
import usePageMeta from '../hooks/usePageMeta'
import { pageTitle } from '../constants/brand'
import './Auth.css'
import './Admin.css'

function AdminLogin({ onLoggedIn }) {
  const { login, isFirebaseConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validateForm = () => {
    const errors = {}
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    if (emailError) errors.email = emailError
    if (passwordError) errors.password = passwordError
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!validateForm()) return

    setSubmitting(true)
    try {
      await login(email.trim(), password)
      onLoggedIn()
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="admin-page__brand">
        <span className="admin-page__badge">Admin</span>
        <h1 className="admin-page__title">Admin Panel</h1>
        <p className="admin-page__subtitle">შედი admin ანგარიშით</p>
        {import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' && (
          <p className="admin-page__hint">
            ლოკალური admin: admin@gmail.com / admin123
          </p>
        )}
      </div>

      {!isFirebaseConfigured && <FirebaseSetupNotice />}
      {formError && <div className="auth-form__alert">{formError}</div>}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-form__field">
          <label htmlFor="admin-email" className="auth-form__label">
            ელ. ფოსტა
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="email"
            className={`auth-form__input ${fieldErrors.email ? 'auth-form__input--error' : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting || !isFirebaseConfigured}
          />
          {fieldErrors.email && <span className="auth-form__error">{fieldErrors.email}</span>}
        </div>

        <div className="auth-form__field">
          <label htmlFor="admin-password" className="auth-form__label">
            პაროლი
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            className={`auth-form__input ${fieldErrors.password ? 'auth-form__input--error' : ''}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting || !isFirebaseConfigured}
          />
          {fieldErrors.password && (
            <span className="auth-form__error">{fieldErrors.password}</span>
          )}
        </div>

        <button
          type="submit"
          className="btn btn--accent btn--lg auth-form__submit"
          disabled={submitting || !isFirebaseConfigured}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="auth-form__spin" />
              იტვირთება...
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              Admin შესვლა
            </>
          )}
        </button>
      </form>

      <p className="admin-page__footer">
        არ გაქვს ანგარიში? <Link to="/register">რეგისტრაცია</Link>
        {' · '}
        <Link to="/">მთავარი გვერდი</Link>
      </p>
    </>
  )
}

function AdminRequestsPanel() {
  const { user, logout } = useAuth()
  const [requests, setRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToPendingDeveloperRequests(
      (items) => {
        setRequests(items)
        setLoadingRequests(false)
      },
      (err) => {
        setError(err.message || 'მოთხოვნების ჩატვირთვა ვერ მოხერხდა.')
        setLoadingRequests(false)
      },
    )

    return unsubscribe
  }, [])

  const handleApprove = async (requestId) => {
    if (!user?.uid) return
    setError('')
    setProcessingId(requestId)
    try {
      await approveDeveloperRequest(requestId, user.uid)
    } catch (err) {
      setError(err.message || 'დადასტურება ვერ მოხერხდა.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId) => {
    if (!user?.uid) return
    setProcessingId(requestId)
    try {
      await rejectDeveloperRequest(requestId, user.uid)
    } catch (err) {
      setError(err.message || 'უარყოფა ვერ მოხერხდა.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <span className="admin-page__badge">Admin</span>
          <h1 className="admin-page__title">დეველოპერის მოთხოვნები</h1>
          <p className="admin-page__subtitle">დაადასტურე ან უარყო ახალი დეველოპერები</p>
        </div>
        <div className="admin-panel__actions">
          <Link to="/dashboard" className="btn btn--outline btn--sm">
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
          <button type="button" className="btn btn--outline btn--sm" onClick={logout}>
            <LogOut size={16} />
            გასვლა
          </button>
        </div>
      </div>

      {error && <div className="auth-form__alert">{error}</div>}

      {loadingRequests ? (
        <div className="admin-panel__empty">იტვირთება...</div>
      ) : requests.length === 0 ? (
        <div className="admin-panel__empty">ახალი მოთხოვნა არ არის.</div>
      ) : (
        <ul className="admin-requests">
          {requests.map((request) => (
            <li key={request.id} className="admin-request">
              <div className="admin-request__info">
                <strong>{request.name || 'უსახელო'}</strong>
                <span>{request.email}</span>
                <DeveloperCvSummary profile={request} />
              </div>
              <div className="admin-request__buttons">
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  disabled={processingId === request.id}
                  onClick={() => handleApprove(request.id)}
                >
                  <CheckCircle2 size={16} />
                  დადასტურება
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--sm admin-request__reject"
                  disabled={processingId === request.id}
                  onClick={() => handleReject(request.id)}
                >
                  <XCircle size={16} />
                  უარყოფა
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Admin() {
  usePageMeta(pageTitle('Admin'), 'DIGIT — ადმინისტრაციის პანელი.')

  const { user, userProfile, loading, logout, refreshUserProfile } = useAuth()
  const [checkingAccess, setCheckingAccess] = useState(false)
  const [accessError, setAccessError] = useState('')
  const [adminReady, setAdminReady] = useState(
    import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'true',
  )
  const [adminSeedError, setAdminSeedError] = useState('')

  useEffect(() => {
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'true') return undefined

    let cancelled = false

    ensureAdminAccount()
      .then(() => {
        if (!cancelled) {
          setAdminReady(true)
          setAdminSeedError('')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setAdminReady(true)
          setAdminSeedError(
            err.message ||
              'Admin ანგარიში ვერ შეიქმნა. გადატვირთე dev server (npm run dev:all).',
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleLoggedIn = async () => {
    setCheckingAccess(true)
    setAccessError('')
    try {
      const profile = await refreshUserProfile()

      if (profile?.developerRequestStatus === DEVELOPER_REQUEST_STATUS.PENDING) {
        await logout()
        setAccessError('თქვენი დეველოპერის მოთხოვნა admin-ის დადასტურებას ელოდება.')
        return
      }

      if (!isStaffRole(profile?.role)) {
        await logout()
        setAccessError('ამ ანგარიშს არ აქვს admin წვდომა.')
      }
    } finally {
      setCheckingAccess(false)
    }
  }

  if (loading || checkingAccess || !adminReady) {
    return (
      <div className="admin-page">
        <div className="auth-loading">
          <div className="auth-loading__spinner" aria-label="იტვირთება..." />
        </div>
      </div>
    )
  }

  if (user && isManagerRole(userProfile?.role)) {
    return (
      <div className="admin-page admin-page--wide">
        <AdminRequestsPanel />
      </div>
    )
  }

  if (user && userProfile?.role === 'developer') {
    return <Navigate to="/developer-dashboard" replace />
  }

  return (
    <div className="admin-page">
      <div className="admin-page__panel">
        <AdminLogin onLoggedIn={handleLoggedIn} />
        {adminSeedError && <div className="auth-form__alert">{adminSeedError}</div>}
        {accessError && <div className="auth-form__alert">{accessError}</div>}
      </div>
    </div>
  )
}

export default Admin
