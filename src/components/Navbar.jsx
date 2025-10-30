import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export const Navbar = () => {
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
            <h1 className="text-xl font-medium text-google-gray-800">AQAR</h1>
          </div>
          
          <div className="flex items-center space-x-4">
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
                <button
                  onClick={handleSignOut}
                  className="btn-primary flex items-center space-x-1"
                >
                  <span className="material-icons text-sm">logout</span>
                  <span>Sign Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

