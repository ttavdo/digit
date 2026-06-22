import DigitMark from './DigitMark'
import { CONTACT_EMAIL, SITE_NAME } from '../constants/brand'
import './Footer.css'

const socialLinks = [
  { label: 'Facebook', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'LinkedIn', href: '#' },
]

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__logo">
              <DigitMark size="sm" />
              <span>{SITE_NAME}</span>
            </div>
            <p className="footer__tagline">
              სანდო სპეციალისტები — ერთი მენეჯერის კონტროლით.
            </p>
          </div>

          <div className="footer__section">
            <h3 className="footer__heading">კონტაქტი</h3>
            <ul className="footer__list">
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </li>
              <li>
                <a href="tel:+995555123456">+995 555 123 456</a>
              </li>
              <li>თბილისი, საქართველო</li>
            </ul>
          </div>

          <div className="footer__section">
            <h3 className="footer__heading">გამოგვყევით</h3>
            <ul className="footer__social">
              {socialLinks.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} aria-label={label}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; {year} {SITE_NAME}. ყველა უფლება დაცულია.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
