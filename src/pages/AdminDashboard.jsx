import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabaseAdmin, hasAdminAccess } from '../lib/supabaseAdmin'
import { Navbar } from '../components/Navbar'

export const AdminDashboard = () => {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [activeTab, setActiveTab] = useState('users') // 'users' | 'documents' | 'logs'
  
  const [logs, setLogs] = useState([])
  const [logsSort, setLogsSort] = useState('desc') // 'asc' | 'desc'
  const [logsEmailFilter, setLogsEmailFilter] = useState('')
  const [logsDateFilter, setLogsDateFilter] = useState('') // yyyy-mm-dd
  const [editingDoc, setEditingDoc] = useState(null)
  const [editingType, setEditingType] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user',
    category: 'c-head'
  })
  const [message, setMessage] = useState({ type: '', text: '' })

  const location = useLocation()

  useEffect(() => {
    fetchUsers()
    fetchDocuments()
    fetchLogs('desc')
  }, [])

  // Listen for tab changes via query param from navbar (e.g., /admin?tab=documents)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab')
    if (tabParam && ['users','documents','logs'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [location.search])

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

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const fetchDocuments = async () => {
    try {
      console.log('📥 Fetching documents...')
      const { data, error } = await supabase
        .from('aqar_documents')
        .select('*')

      if (error) throw error
      
      // Sort documents by criterion_id, section_id, then item_id
      const sortedData = (data || []).sort((a, b) => {
        // Compare criterion_id (e.g., "1" vs "2")
        if (a.criterion_id !== b.criterion_id) {
          return parseInt(a.criterion_id) - parseInt(b.criterion_id)
        }
        // Compare section_id (e.g., "1.1" vs "1.2")
        if (a.section_id !== b.section_id) {
          const aSectionParts = a.section_id.split('.').map(Number)
          const bSectionParts = b.section_id.split('.').map(Number)
          for (let i = 0; i < Math.max(aSectionParts.length, bSectionParts.length); i++) {
            const aPart = aSectionParts[i] || 0
            const bPart = bSectionParts[i] || 0
            if (aPart !== bPart) return aPart - bPart
          }
        }
        // Compare item_id (e.g., "1.1.1" vs "1.1.2")
        const aItemParts = a.item_id.split('.').map(Number)
        const bItemParts = b.item_id.split('.').map(Number)
        for (let i = 0; i < Math.max(aItemParts.length, bItemParts.length); i++) {
          const aPart = aItemParts[i] || 0
          const bPart = bItemParts[i] || 0
          if (aPart !== bPart) return aPart - bPart
        }
        return 0
      })
      
      console.log('📊 Fetched documents count:', sortedData.length)
      console.log('📊 Sample of fetched data:', sortedData.slice(0, 3))
      setDocuments(sortedData)
    } catch (error) {
      console.error('❌ Error fetching documents:', error)
    }
  }

  const fetchLogs = async (order = logsSort, email = logsEmailFilter, dateStr = logsDateFilter) => {
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('occurred_at', { ascending: order === 'asc' })

      if (email && email.trim().length > 0) {
        query = query.ilike('email', `%${email.trim()}%`)
      }

      if (dateStr) {
        const start = new Date(dateStr)
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(end.getDate() + 1)
        query = query.gte('occurred_at', start.toISOString()).lt('occurred_at', end.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('❌ Error fetching activity logs:', error)
    }
  }

  const handleUpdateDocument = async (docId, newUrl) => {
    console.log('🔄 Updating document:', docId, 'New URL:', newUrl)
    setMessage({ type: '', text: '' })

    try {
      const { data, error } = await supabase
        .from('aqar_documents')
        .update({ 
          document_url: newUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', docId)
        .select()

      if (error) {
        console.error('❌ Update error:', error)
        throw error
      }

      console.log('✅ Document updated:', data)

      // Fetch updated documents first, then clear editing state
      await fetchDocuments()
      setEditingDoc(null)
      setMessage({ type: 'success', text: 'Document link updated successfully!' })
    } catch (error) {
      console.error('❌ Error in handleUpdateDocument:', error)
      setMessage({ type: 'error', text: error.message })
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

      // Fetch updated documents first, then clear editing state
      await fetchDocuments()
      setEditingType(null)
      setMessage({ type: 'success', text: 'Document type updated successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCategory = async (userId, newCategory) => {
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ 
          category: newCategory
        })
        .eq('user_id', userId)

      if (error) throw error

      // Fetch updated users first, then clear editing state
      await fetchUsers()
      setEditingCategory(null)
      setMessage({ type: 'success', text: 'User category updated successfully!' })
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
            role: formData.role,
            category: formData.category
          }
        ])

      if (roleError) throw roleError

      setMessage({ type: 'success', text: 'User created successfully!' })
      setFormData({ email: '', password: '', role: 'user', category: 'c-head' })
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
        <div className="mb-6">
          {/* Desktop: horizontal tabs */}
          <div className="hidden md:block border-b border-google-gray-200">
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
              <button
                onClick={() => setActiveTab('logs')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'logs'
                    ? 'border-google-blue-500 text-google-blue-600'
                    : 'border-transparent text-google-gray-600 hover:text-google-gray-800 hover:border-google-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-sm">history</span>
                  <span>Activity Logs</span>
                </div>
              </button>
            </div>
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
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field pr-10"
                    placeholder="Enter secure password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-google-gray-400 hover:text-google-blue-600"
                    aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-icons text-base">{showCreatePassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
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

              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                >
                  <option value="c-head">C-Head</option>
                  <option value="c-sub-head">C-Sub-Head</option>
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
                    Category
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCategory === user.user_id ? (
                        <select
                          defaultValue={user.category || 'c-head'}
                          onChange={(e) => handleUpdateCategory(user.user_id, e.target.value)}
                          onBlur={() => setEditingCategory(null)}
                          className="input-field text-sm py-1 px-2"
                          autoFocus
                        >
                          <option value="c-head">C-Head</option>
                          <option value="c-sub-head">C-Sub-Head</option>
                        </select>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${
                            user.category === 'c-head' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {user.category || 'N/A'}
                          </span>
                          <button
                            onClick={() => setEditingCategory(user.user_id)}
                            className="text-google-gray-400 hover:text-google-blue-600"
                            title="Edit category"
                          >
                            <span className="material-icons text-xs">edit</span>
                          </button>
                        </div>
                      )}
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

        {/* Activity Logs Tab */}
        {activeTab === 'logs' && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-medium text-google-gray-800 mb-1">Activity Logs</h2>
              <p className="text-sm text-google-gray-600">Track user logins with timestamps</p>
            </div>
            <div className="card mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-google-gray-600 mb-1">Filter by email</label>
                  <input
                    type="text"
                    value={logsEmailFilter}
                    onChange={(e) => setLogsEmailFilter(e.target.value)}
                    onBlur={() => fetchLogs(logsSort)}
                    className="input-field py-2 px-3 text-sm w-full"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-google-gray-600 mb-1">Filter by date</label>
                  <input
                    type="date"
                    value={logsDateFilter}
                    onChange={(e) => { setLogsDateFilter(e.target.value); fetchLogs(logsSort, logsEmailFilter, e.target.value) }}
                    className="input-field py-2 px-3 text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-google-gray-600 mb-1">Sort by time</label>
                  <select
                    value={logsSort}
                    onChange={(e) => { setLogsSort(e.target.value); fetchLogs(e.target.value) }}
                    className="input-field py-2 px-3 text-sm w-full"
                  >
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => { setLogsEmailFilter(''); setLogsDateFilter(''); fetchLogs(logsSort, '', '') }}
                    className="btn-secondary w-full"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-google-gray-200 text-sm md:text-base">
                  <thead className="bg-google-gray-50">
                    <tr>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-google-gray-600 uppercase tracking-wider">Email</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-google-gray-600 uppercase tracking-wider">Activity</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-google-gray-600 uppercase tracking-wider">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-google-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-google-gray-50 transition-colors">
                        <td className="px-3 md:px-6 py-3 whitespace-nowrap text-google-gray-800">{log.email}</td>
                        <td className="px-3 md:px-6 py-3 whitespace-nowrap text-google-gray-800">{log.activity}</td>
                        <td className="px-3 md:px-6 py-3 whitespace-nowrap text-google-gray-600">{new Date(log.occurred_at || log.login_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {logs.length === 0 && (
                  <div className="text-center py-12">
                    <span className="material-icons text-google-gray-400 text-5xl mb-3">history_toggle_off</span>
                    <p className="text-google-gray-500">No activity yet.</p>
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

