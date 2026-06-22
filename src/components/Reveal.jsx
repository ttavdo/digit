import { useEffect, useRef, useState } from 'react'
import './Reveal.css'

function Reveal({ children, className = '', delay = 0, variant = 'up', as: Tag = 'div' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    const fallback = window.setTimeout(() => {
      setVisible(true)
    }, 600)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(element)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(element)

    return () => {
      window.clearTimeout(fallback)
      observer.disconnect()
    }
  }, [])

  const variantClass =
    variant === 'fade'
      ? 'reveal--fade'
      : variant === 'scale'
        ? 'reveal--scale'
        : variant === 'left'
          ? 'reveal--slide-left'
          : variant === 'right'
            ? 'reveal--slide-right'
            : ''

  return (
    <Tag
      ref={ref}
      className={`reveal ${variantClass} ${visible ? 'reveal--visible' : ''} ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}

export default Reveal
