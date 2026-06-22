import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import FirebaseSetupNotice from '../components/FirebaseSetupNotice'
import GoogleIcon from '../components/icons/GoogleIcon'
import {
  getAuthErrorMessage,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordMatch,
} from '../utils/authErrors'
import { getPostLoginRedirect } from '../utils/roles'
import usePageMeta from '../hooks/usePageMeta'
import { pageTitle } from '../constants/brand'
import './Auth.css'

function Register() {
  usePageMeta(pageTitle('რეგისტრაცია'), 'DIGIT — შექმენით ანგარიში და დაიწყეთ საუბარი მენეჯერთან.')
  const { signup, loginWithGoogle, refreshUserProfile, isFirebaseConfigured } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accountType, setAccountType] = useState('customer')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validateForm = () => {
    const errors = {}
    const nameError = validateName(name)
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    const confirmError = validatePasswordMatch(password, confirmPassword)

    if (nameError) errors.name = nameError
    if (emailError) errors.email = emailError
    if (passwordError) errors.password = passwordError
    if (confirmError) errors.confirmPassword = confirmError

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const result = await signup(email.trim(), password, name.trim(), accountType)

      if (result.pendingDeveloper) {
        setSuccessMessage(
          'რეგისტრაცია წარმატებულია. დეველოპერის სტატუსის მოთხოვნა გაგზავნილია admin-თან დასადასტურებლად.',
        )
        return
      }

      navigate(getPostLoginRedirect(
        (await refreshUserProfile())?.role,
      ), { replace: true })
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleSignup = async () => {
    setFormError('')
    setSubmitting(true)
    try {
      await loginWithGoogle()
      navigate(getPostLoginRedirect(
        (await refreshUserProfile())?.role,
      ), { replace: true })
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page auth-page">
      <div className="container">
        <div className="auth-card">
          <h1 className="auth-card__title">რეგისტრაცია</h1>
          <p className="auth-card__subtitle">შექმენი ანგარიში და დაიწყე</p>

          {!isFirebaseConfigured && <FirebaseSetupNotice />}

          {formError && <div className="auth-form__alert">{formError}</div>}
          {successMessage && <div className="auth-form__success">{successMessage}</div>}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-form__field">
              <label htmlFor="register-name" className="auth-form__label">
                სახელი
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                className={`auth-form__input ${fieldErrors.name ? 'auth-form__input--error' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting || !isFirebaseConfigured || !!successMessage}
              />
              {fieldErrors.name && (
                <span className="auth-form__error">{fieldErrors.name}</span>
              )}
            </div>

            <div className="auth-form__field">
              <label htmlFor="register-email" className="auth-form__label">
                ელ. ფოსტა
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                className={`auth-form__input ${fieldErrors.email ? 'auth-form__input--error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting || !isFirebaseConfigured || !!successMessage}
              />
              {fieldErrors.email && (
                <span className="auth-form__error">{fieldErrors.email}</span>
              )}
            </div>

            <div className="auth-form__field">
              <label htmlFor="register-password" className="auth-form__label">
                პაროლი
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                className={`auth-form__input ${fieldErrors.password ? 'auth-form__input--error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting || !isFirebaseConfigured || !!successMessage}
              />
              {fieldErrors.password && (
                <span className="auth-form__error">{fieldErrors.password}</span>
              )}
            </div>

            <div className="auth-form__field">
              <label htmlFor="register-confirm" className="auth-form__label">
                პაროლის დადასტურება
              </label>
              <input
                id="register-confirm"
                type="password"
                autoComplete="new-password"
                className={`auth-form__input ${fieldErrors.confirmPassword ? 'auth-form__input--error' : ''}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting || !isFirebaseConfigured || !!successMessage}
              />
              {fieldErrors.confirmPassword && (
                <span className="auth-form__error">{fieldErrors.confirmPassword}</span>
              )}
            </div>

            <fieldset className="auth-form__field auth-role-select">
              <legend className="auth-form__label">ანგარიშის ტიპი</legend>
              <label className="auth-role-select__option">
                <input
                  type="radio"
                  name="accountType"
                  value="customer"
                  checked={accountType === 'customer'}
                  onChange={() => setAccountType('customer')}
                  disabled={submitting || !isFirebaseConfigured || !!successMessage}
                />
                <span className="auth-role-select__content">
                  <strong>მომხმარებელი</strong>
                  <small>სერვისებით სარგებლობა და ჩატი მენეჯერთან</small>
                </span>
              </label>
              <label className="auth-role-select__option">
                <input
                  type="radio"
                  name="accountType"
                  value="developer"
                  checked={accountType === 'developer'}
                  onChange={() => setAccountType('developer')}
                  disabled={submitting || !isFirebaseConfigured || !!successMessage}
                />
                <span className="auth-role-select__content">
                  <strong>დეველოპერი</strong>
                  <small>admin-ის დადასტურების შემდეგ გაიხსნება Dashboard</small>
                </span>
              </label>
            </fieldset>

            <button
              type="submit"
              className="btn btn--primary btn--lg auth-form__submit"
              disabled={submitting || !isFirebaseConfigured || !!successMessage}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="auth-form__spin" />
                  იტვირთება...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  რეგისტრაცია
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">ან</div>

          <button
            type="button"
            className="btn btn--outline auth-google"
            onClick={handleGoogleSignup}
            disabled={submitting || !isFirebaseConfigured}
          >
            <GoogleIcon size={18} />
            Google-ით რეგისტრაცია
          </button>

          <p className="auth-footer">
            უკვე გაქვს ანგარიში? <Link to="/login">შესვლა</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
