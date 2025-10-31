import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export const Navbar = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const { user, userRole, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-google-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-medium text-google-gray-800">NAACTrack</h1>
          </div>
          
          <div className="flex items-center space-x-4 relative">
            {user && (
              <>
                <div className="text-sm flex items-center space-x-3">
                  <div className="hidden sm:block">
                    <span className="text-google-gray-600">Logged in as:</span>{' '}
                    <span className="font-medium text-google-gray-800">{user.email}</span>
                  </div>
                  {userRole && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      userRole === 'admin' 
                        ? 'bg-google-blue-100 text-google-blue-700' 
                        : 'bg-google-green-100 text-google-green-700'
                    }`}>
                      {userRole}
                    </span>
                  )}
                </div>
                {/* Desktop/tablet: show Sign Out button */}
                <button
                  onClick={handleSignOut}
                  className="btn-primary flex items-center space-x-1 hidden sm:flex"
                >
                  <span className="material-icons text-sm">logout</span>
                  <span>Sign Out</span>
                </button>
                {/* Mobile: show hamburger that opens menu with Sign Out */}
                <button
                  type="button"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="sm:hidden btn-secondary rounded-full w-10 h-10 p-0 flex items-center justify-center"
                  aria-label="Open menu"
                >
                  <span className="material-icons">menu</span>
                </button>
                {showMobileMenu && (
                  <div className="absolute right-0 top-12 bg-white border border-google-gray-200 rounded-lg shadow-lg w-52 py-1 z-50">
                    {userRole === 'admin' && (
                      <>
                        <button
                          onClick={() => { setShowMobileMenu(false); navigate('/admin?tab=users') }}
                          className="w-full text-left px-4 py-2 text-sm text-google-gray-800 hover:bg-google-gray-50 flex items-center gap-2"
                        >
                          <span className="material-icons text-sm">people</span>
                          <span>User Management</span>
                        </button>
                        <button
                          onClick={() => { setShowMobileMenu(false); navigate('/admin?tab=documents') }}
                          className="w-full text-left px-4 py-2 text-sm text-google-gray-800 hover:bg-google-gray-50 flex items-center gap-2"
                        >
                          <span className="material-icons text-sm">link</span>
                          <span>Document Links</span>
                        </button>
                        <button
                          onClick={() => { setShowMobileMenu(false); navigate('/admin?tab=logs') }}
                          className="w-full text-left px-4 py-2 text-sm text-google-gray-800 hover:bg-google-gray-50 flex items-center gap-2"
                        >
                          <span className="material-icons text-sm">history</span>
                          <span>Activity Logs</span>
                        </button>
                        <hr className="my-1" />
                      </>
                    )}
                    <button
                      onClick={() => { setShowMobileMenu(false); handleSignOut() }}
                      className="w-full text-left px-4 py-2 text-sm text-google-gray-800 hover:bg-google-gray-50 flex items-center gap-2"
                    >
                      <span className="material-icons text-sm">logout</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

