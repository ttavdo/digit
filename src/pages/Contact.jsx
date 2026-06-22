import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Send, Phone, Mail, Clock, Zap, Calendar, Timer } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import FirebaseSetupNotice from '../components/FirebaseSetupNotice'
import Reveal from '../components/Reveal'
import usePageMeta from '../hooks/usePageMeta'
import { CONTACT_EMAIL, pageTitle } from '../constants/brand'
import { allServices, getServiceById } from '../data/services'
import {
  createTicket,
  ORDER_PRIORITY,
  ORDER_PRIORITY_LABELS,
} from '../services/orderService'
import { MAX_ORDER_DESCRIPTION_LENGTH, validateMessageLength } from '../utils/validation'
import './Contact.css'

const PRIORITY_OPTIONS = [
  { value: ORDER_PRIORITY.URGENT, label: ORDER_PRIORITY_LABELS.urgent, icon: Zap },
  { value: ORDER_PRIORITY.TOMORROW, label: ORDER_PRIORITY_LABELS.tomorrow, icon: Calendar },
  { value: ORDER_PRIORITY.FLEXIBLE, label: ORDER_PRIORITY_LABELS.flexible, icon: Timer },
]

function Contact() {
  usePageMeta(
    pageTitle('ახალი მოთხოვნა'),
    'DIGIT — გამოიძახე IT დახმარება — ისევე მარტივად, როგორც ტაქსი.',
  )

  const { user, userProfile, isFirebaseConfigured } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const serviceIdFromUrl = searchParams.get('service')

  const [serviceId, setServiceId] = useState(
    () => serviceIdFromUrl || allServices[0]?.id || '',
  )
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState(ORDER_PRIORITY.TOMORROW)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const selectedService = getServiceById(serviceId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = description.trim()
    const lengthError = validateMessageLength(trimmed, MAX_ORDER_DESCRIPTION_LENGTH)

    if (!user || !trimmed || lengthError) {
      if (lengthError) setError(lengthError)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await createTicket({
        customerId: user.uid,
        customerName:
          userProfile?.name || user.displayName || user.email?.split('@')[0] || 'ბიზნესი',
        serviceId,
        serviceType: selectedService?.title || serviceId,
        description: trimmed,
        priority,
      })
      setSuccess(true)
      setTimeout(() => navigate('/my-requests'), 1500)
    } catch (err) {
      setError(err.message || 'მოთხოვნის გაგზავნა ვერ მოხერხდა.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="page-hero page-hero--compact">
        <div className="container">
          <Reveal>
            <h1 className="page-hero__title">გამოიძახე დახმარება</h1>
            <p className="page-hero__text">
              ისევე მარტივად, როგორც ტაქსი — აირჩიე კატეგორია, აღწერე პრობლემა და მიუთითე პრიორიტეტი.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="page contact-page">
        <div className="container">
          {!isFirebaseConfigured && <FirebaseSetupNotice />}

          {success ? (
            <div className="ticket-success">
              <h2>მოთხოვნა გაგზავნილია!</h2>
              <p>მენეჯერი მალე დაგიკავშირდება ფასის შეთავაზებით.</p>
              <Link to="/my-requests" className="btn btn--primary">
                ჩემი მოთხოვნები
              </Link>
            </div>
          ) : (
            <div className="ticket-layout">
              <form className="ticket-form" onSubmit={handleSubmit} noValidate>
                {error && <div className="contact-page__error">{error}</div>}

                <div className="ticket-form__field">
                  <label htmlFor="ticket-service" className="ticket-form__label">
                    კატეგორია
                  </label>
                  <select
                    id="ticket-service"
                    className="ticket-form__select"
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    disabled={submitting}
                    required
                  >
                    {allServices.map(({ id, title }) => (
                      <option key={id} value={id}>
                        {title}
                      </option>
                    ))}
                  </select>
                  {selectedService && (
                    <p className="ticket-form__hint">{selectedService.description}</p>
                  )}
                </div>

                <div className="ticket-form__field">
                  <span className="ticket-form__label">პრიორიტეტი</span>
                  <div className="ticket-priority">
                    {PRIORITY_OPTIONS.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        className={`ticket-priority__btn ${priority === value ? 'ticket-priority__btn--active' : ''} ticket-priority__btn--${value}`}
                        onClick={() => setPriority(value)}
                        disabled={submitting}
                      >
                        <Icon size={18} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ticket-form__field">
                  <label htmlFor="ticket-description" className="ticket-form__label">
                    პრობლემის აღწერა
                  </label>
                  <textarea
                    id="ticket-description"
                    className="ticket-form__textarea"
                    rows={6}
                    placeholder="აღწერე რა პრობლემა გაქვს, რა გჭირდება..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={submitting || !isFirebaseConfigured}
                    required
                    maxLength={MAX_ORDER_DESCRIPTION_LENGTH}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn--primary btn--lg ticket-form__submit"
                  disabled={submitting || !description.trim() || !isFirebaseConfigured}
                >
                  <Send size={18} />
                  {submitting ? 'იგზავნება...' : 'მოთხოვნის გაგზავნა'}
                </button>
              </form>

              <aside className="contact-info">
                <h2 className="contact-info__title">სხვა გზით დაკავშირება</h2>
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
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Contact
