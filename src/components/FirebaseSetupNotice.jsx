import './FirebaseSetupNotice.css'

function FirebaseSetupNotice() {
  return (
    <div className="firebase-setup">
      <h2 className="firebase-setup__title">Firebase არ არის კონფიგურირებული</h2>
      <p className="firebase-setup__text">
        საიტი მუშაობს, მაგრამ ავტორიზაცია და ჩატი საჭიროებს Firebase-ის ჩართვას.
      </p>
      <ol className="firebase-setup__steps">
        <li>
          გახსენი{' '}
          <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
            Firebase Console
          </a>
        </li>
        <li>Project settings → Your apps → Web app → Config</li>
        <li>
          ჩასვი მნიშვნელობები <code>.env</code> ფაილში (იხილე <code>.env.example</code>)
        </li>
        <li>
          გადატვირთე server: <code>npm run dev</code>
        </li>
      </ol>
    </div>
  )
}

export default FirebaseSetupNotice
