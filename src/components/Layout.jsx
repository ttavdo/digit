import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import FirebaseSetupNotice from './FirebaseSetupNotice'
import { isFirebaseConfigured } from '../firebase'

function Layout() {
  return (
    <>
      <Navbar />
      {!isFirebaseConfigured && (
        <div className="container" style={{ paddingTop: '1rem' }}>
          <FirebaseSetupNotice />
        </div>
      )}
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default Layout
