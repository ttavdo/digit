import { useEffect, useState } from 'react'
import { ClipboardPlus, Loader2, X } from 'lucide-react'
import { allServices } from '../../data/services'
import { createOrder } from '../../services/orderService'
import { MAX_ORDER_DESCRIPTION_LENGTH, validateMessageLength } from '../../utils/validation'
import './CreateOrderModal.css'

function CreateOrderModal({ conversation, onClose, onCreated }) {
  const [serviceType, setServiceType] = useState(
    () =>
      allServices.find((s) => s.id === conversation?.serviceRequested)?.title ||
      allServices[0]?.title ||
      '',
  )
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedDescription = description.trim()
    const lengthError = validateMessageLength(trimmedDescription, MAX_ORDER_DESCRIPTION_LENGTH)
    if (!conversation || !serviceType.trim() || !trimmedDescription || lengthError) {
      if (lengthError) setError(lengthError)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const orderId = await createOrder({
        conversationId: conversation.id,
        customerId: conversation.customerId,
        customerName: conversation.customerName,
        serviceType: serviceType.trim(),
        description: trimmedDescription,
      })
      onCreated(orderId)
      onClose()
    } catch (err) {
      setError(err.message || 'შეკვეთის შექმნა ვერ მოხერხდა.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="order-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="order-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="create-order-title"
      >
        <h2 id="create-order-title" className="order-modal__title">
          შეკვეთის შექმნა
        </h2>
        <p className="order-modal__subtitle">
          კლიენტი: <strong>{conversation?.customerName}</strong>
        </p>

        {error && <div className="order-modal__error">{error}</div>}

        <form className="order-modal__form" onSubmit={handleSubmit}>
          <div className="order-modal__field">
            <label htmlFor="order-service" className="order-modal__label">
              სერვისის ტიპი
            </label>
            <select
              id="order-service"
              className="order-modal__select"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              disabled={submitting}
            >
              {allServices.map(({ id, title }) => (
                <option key={id} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          <div className="order-modal__field">
            <label htmlFor="order-description" className="order-modal__label">
              აღწერა
            </label>
            <textarea
              id="order-description"
              className="order-modal__textarea"
              rows={5}
              placeholder="შეკვეთის დეტალები..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              required
              maxLength={MAX_ORDER_DESCRIPTION_LENGTH}
            />
          </div>

          <div className="order-modal__actions">
            <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
              <X size={18} />
              გაუქმება
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting || !description.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="auth-form__spin" />
                  იქმნება...
                </>
              ) : (
                <>
                  <ClipboardPlus size={18} />
                  შეკვეთის შექმნა
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateOrderModal
