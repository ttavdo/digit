import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import './Accordion.css'

function Accordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <div className="accordion">
      {items.map(({ question, answer }, index) => {
        const isOpen = openIndex === index

        return (
          <div
            key={question}
            className={`accordion__item ${isOpen ? 'accordion__item--open' : ''}`}
          >
            <button
              type="button"
              className="accordion__trigger"
              aria-expanded={isOpen}
              onClick={() => toggle(index)}
            >
              <span>{question}</span>
              <ChevronDown
                size={20}
                className="accordion__icon"
                aria-hidden="true"
              />
            </button>
            <div className="accordion__panel" aria-hidden={!isOpen}>
              <p className="accordion__answer">{answer}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Accordion
