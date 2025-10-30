import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-google-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-google-blue-100 border-t-google-blue-600"></div>
          <p className="mt-4 text-google-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  return children
}

