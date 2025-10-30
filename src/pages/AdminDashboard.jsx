import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { supabaseAdmin, hasAdminAccess } from '../lib/supabaseAdmin'
import { Navbar } from '../components/Navbar'

export const AdminDashboard = () => {
  const [users, setUsers] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState('users') // 'users' or 'documents'
  const [editingDoc, setEditingDoc] = useState(null)
  const [editingType, setEditingType] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user'
  })
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchUsers()
    fetchDocuments()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('aqar_documents')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleUpdateDocument = async (docId, newUrl) => {
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('aqar_documents')
        .update({ 
          document_url: newUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', docId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Document link updated successfully!' })
      setEditingDoc(null)
      fetchDocuments()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDocumentType = async (docId, newType) => {
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('aqar_documents')
        .update({ 
          document_type: newType,
          updated_at: new Date().toISOString()
        })
        .eq('id', docId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Document type updated successfully!' })
      setEditingType(null)
      fetchDocuments()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // Check if admin client is available
      if (!hasAdminAccess()) {
        throw new Error(
          'Service Role Key not configured. Add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file and restart the server.'
        )
      }

      // Create user in Supabase Auth using admin client
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true
      })

      if (authError) throw authError

      // Add role to user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: authData.user.id,
            email: formData.email,
            role: formData.role
          }
        ])

      if (roleError) throw roleError

      setMessage({ type: 'success', text: 'User created successfully!' })
      setFormData({ email: '', password: '', role: 'user' })
      setShowCreateForm(false)
      fetchUsers()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId, email) => {
    if (!confirm(`Are you sure you want to delete user ${email}?`)) return

    try {
      // Check if admin client is available
      if (!hasAdminAccess()) {
        throw new Error(
          'Service Role Key not configured. Cannot delete users.'
        )
      }

      // Delete from auth using admin client
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (authError) throw authError

      // Delete from user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)

      if (roleError) throw roleError

      setMessage({ type: 'success', text: 'User deleted successfully!' })
      fetchUsers()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  return (
    <div className="min-h-screen bg-google-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-google-gray-800 mb-1">Admin Dashboard</h1>
          <p className="text-google-gray-600">Manage users and document links</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-google-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-google-blue-500 text-google-blue-600'
                  : 'border-transparent text-google-gray-600 hover:text-google-gray-800 hover:border-google-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="material-icons text-sm">people</span>
                <span>User Management</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'documents'
                  ? 'border-google-blue-500 text-google-blue-600'
                  : 'border-transparent text-google-gray-600 hover:text-google-gray-800 hover:border-google-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="material-icons text-sm">link</span>
                <span>Document Links</span>
              </div>
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-start ${
            message.type === 'success' 
              ? 'bg-google-green-50 text-google-green-800 border border-google-green-200' 
              : 'bg-google-red-50 text-google-red-700 border border-google-red-200'
          }`}>
            <span className={`material-icons mr-2 ${
              message.type === 'success' ? 'text-google-green-600' : 'text-google-red-600'
            }`}>
              {message.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{message.text}</span>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-google-gray-800">User Management</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn-primary flex items-center space-x-2"
              >
                <span className="material-icons text-sm">{showCreateForm ? 'close' : 'person_add'}</span>
                <span>{showCreateForm ? 'Cancel' : 'Create New User'}</span>
              </button>
            </div>

        {showCreateForm && (
          <div className="card mb-8">
            <h2 className="text-xl font-medium text-google-gray-800 mb-6">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  placeholder="Enter secure password"
                  required
                  minLength={6}
                />
                <p className="text-xs text-google-gray-500 mt-1.5 flex items-center">
                  <span className="material-icons text-xs mr-1">info</span>
                  Minimum 6 characters required
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-field"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="btn-primary flex items-center space-x-2">
                <span className="material-icons text-sm">person_add</span>
                <span>{loading ? 'Creating User...' : 'Create User'}</span>
              </button>
            </form>
          </div>
        )}

        <div className="card">
          <h2 className="text-xl font-medium text-google-gray-800 mb-6">All Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-google-gray-200">
              <thead className="bg-google-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-google-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-google-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-google-gray-600 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-google-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-google-gray-200">
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-google-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-google-gray-800">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-google-blue-100 text-google-blue-700' 
                          : 'bg-google-green-100 text-google-green-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-google-gray-600">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteUser(user.user_id, user.email)}
                        className="text-google-red-600 hover:text-google-red-700 font-medium flex items-center space-x-1"
                      >
                        <span className="material-icons text-sm">delete</span>
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12">
                <span className="material-icons text-google-gray-400 text-5xl mb-3">people_outline</span>
                <p className="text-google-gray-500">No users found. Create your first user!</p>
              </div>
            )}
          </div>
        </div>
          </div>
        )}

        {/* Document Links Tab */}
        {activeTab === 'documents' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-medium text-google-gray-800 mb-2">Document Link Management</h2>
              <p className="text-sm text-google-gray-600">Update Google Drive links for AQAR documents</p>
            </div>

            <div className="card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-google-gray-200">
                  <thead className="bg-google-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-google-gray-600 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-google-gray-600 uppercase tracking-wider">
                        Criterion & Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-google-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-google-gray-600 uppercase tracking-wider">
                        Current Link
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-google-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-google-gray-200">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-google-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="material-icons text-sm text-google-blue-600">
                              link
                            </span>
                            <span className="text-sm font-medium text-google-gray-900">{doc.document_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-google-gray-600">
                            <div className="font-medium text-google-gray-800">{doc.item_id}</div>
                            <div className="text-xs text-google-gray-500">Criterion {doc.criterion_id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingType === doc.id ? (
                            <select
                              defaultValue={doc.document_type}
                              onChange={(e) => handleUpdateDocumentType(doc.id, e.target.value)}
                              onBlur={() => setEditingType(null)}
                              className="input-field text-sm py-1 px-2"
                              autoFocus
                            >
                              <option value="PDF">PDF</option>
                              <option value="Excel">Excel</option>
                              <option value="Word">Word</option>
                              <option value="PowerPoint">PowerPoint</option>
                              <option value="Image">Image</option>
                              <option value="Video">Video</option>
                              <option value="Other">Other</option>
                            </select>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-google-blue-100 text-google-blue-700">
                                {doc.document_type}
                              </span>
                              <button
                                onClick={() => setEditingType(doc.id)}
                                className="text-google-gray-400 hover:text-google-blue-600"
                              >
                                <span className="material-icons text-xs">edit</span>
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingDoc === doc.id ? (
                            <input
                              type="url"
                              defaultValue={doc.document_url}
                              onBlur={(e) => {
                                if (e.target.value !== doc.document_url) {
                                  handleUpdateDocument(doc.id, e.target.value)
                                } else {
                                  setEditingDoc(null)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateDocument(doc.id, e.target.value)
                                } else if (e.key === 'Escape') {
                                  setEditingDoc(null)
                                }
                              }}
                              className="input-field text-sm"
                              placeholder="https://drive.google.com/file/d/..."
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center space-x-2">
                              <a
                                href={doc.document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-google-blue-600 hover:text-google-blue-700 hover:underline flex items-center space-x-1 max-w-xs truncate"
                              >
                                <span className="truncate">{doc.document_url}</span>
                                <span className="material-icons text-xs">open_in_new</span>
                              </a>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setEditingDoc(doc.id)}
                            className="text-google-blue-600 hover:text-google-blue-700 font-medium flex items-center space-x-1"
                          >
                            <span className="material-icons text-sm">edit</span>
                            <span>Edit Link</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {documents.length === 0 && (
                  <div className="text-center py-12">
                    <span className="material-icons text-google-gray-400 text-5xl mb-3">link_off</span>
                    <p className="text-google-gray-500">No documents found. Run the setup SQL script first.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

