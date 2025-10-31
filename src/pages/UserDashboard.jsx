import { useState, useEffect } from 'react'
import { Navbar } from '../components/Navbar'
import { supabase } from '../lib/supabase'

// Natural sort function for IDs like "1.1.1", "1.1.2", etc.
const naturalSort = (a, b) => {
  const aParts = a.split('.').map(Number)
  const bParts = b.split('.').map(Number)
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0
    const bPart = bParts[i] || 0
    if (aPart !== bPart) return aPart - bPart
  }
  return 0
}

// Transform database documents into the aqarData structure
const transformDocumentsToAqarData = (documents) => {
  const criteriaMap = {}
  
  documents.forEach(doc => {
    // Initialize criterion if it doesn't exist
    if (!criteriaMap[doc.criterion_id]) {
      criteriaMap[doc.criterion_id] = {
        id: doc.criterion_id,
        title: doc.criterion_title,
        sections: {}
      }
    }
    
    // Initialize section if it doesn't exist
    if (!criteriaMap[doc.criterion_id].sections[doc.section_id]) {
      criteriaMap[doc.criterion_id].sections[doc.section_id] = {
        id: doc.section_id,
        title: doc.section_title,
        items: {}
      }
    }
    
    // Initialize item if it doesn't exist
    if (!criteriaMap[doc.criterion_id].sections[doc.section_id].items[doc.item_id]) {
      criteriaMap[doc.criterion_id].sections[doc.section_id].items[doc.item_id] = {
        id: doc.item_id,
        description: doc.item_description,
        documents: []
      }
    }
    
    // Add document
    criteriaMap[doc.criterion_id].sections[doc.section_id].items[doc.item_id].documents.push({
      name: doc.document_name,
      type: doc.document_type,
      url: doc.document_url
    })
  })
  
  // Convert to array format with proper sorting
  const criteria = Object.keys(criteriaMap).sort((a, b) => parseInt(a) - parseInt(b))
  
  return criteria.map(criterionId => {
    const criterion = criteriaMap[criterionId]
    const sectionIds = Object.keys(criterion.sections).sort(naturalSort)
    
    return {
      ...criterion,
      sections: sectionIds.map(sectionId => {
        const section = criterion.sections[sectionId]
        const itemIds = Object.keys(section.items).sort(naturalSort)
        
        return {
          ...section,
          items: itemIds.map(itemId => section.items[itemId])
        }
      })
    }
  })
}

// Fallback data in case database is not set up yet
const fallbackAqarData = [
  {
    id: 1,
    title: 'CRITERION I - CURRICULAR ASPECTS',
    sections: [
      {
        id: '1.1',
        title: '1.1 - Curriculum Design and Development',
        items: [
          {
            id: '1.1.1',
            description: 'Curricula developed and implemented have relevance to the local, national, regional and global developmental needs which are reflected in Programme Outcomes (POs), Programme Specific Outcomes (PSOs) and Course Outcomes (COs) of the various Programmes offered by the Institution.',
            documents: [
              { name: 'Curricula Developed & Implementation', type: 'PDF', url: 'https://drive.google.com/file/d/PLACEHOLDER_1_1_1/view' }
            ]
          },
          {
            id: '1.1.2',
            description: 'Number of Programmes where syllabus revision was carried out during the year',
            documents: [
              { name: 'Details of syllabus revision', type: 'PDF', url: 'https://drive.google.com/file/d/PLACEHOLDER_1_1_2/view' }
            ]
          },
          {
            id: '1.1.3',
            description: 'Number of courses focusing on employability/entrepreneurship/skill development offered by the Institution during the year',
            documents: [
              { name: 'Weblink Information - C113', type: 'PDF', url: 'https://drive.google.com/file/d/PLACEHOLDER_1_1_3a/view' },
              { name: 'NAAC Template - C113', type: 'Excel', url: 'https://drive.google.com/file/d/PLACEHOLDER_1_1_3b/view' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'CRITERION II: TEACHING-LEARNING AND EVALUATION',
    sections: [
      {
        id: '2.1',
        title: '2.1 - Student Enrollment and Profile',
        items: [
          {
            id: '2.1.1',
            description: 'Average enrollment percentage of students during the year',
            documents: [
              { name: 'Enrollment Data', type: 'PDF', url: 'https://drive.google.com/file/d/PLACEHOLDER_2_1_1/view' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 3,
    title: 'CRITERION III - RESEARCH, INNOVATIONS AND EXTENSION',
    sections: [
      {
        id: '3.1',
        title: '3.1 - Resource Mobilization for Research',
        items: [
          {
            id: '3.1.1',
            description: 'Grants received from Government and non-governmental agencies for research projects',
            documents: [
              { name: 'Research Grants Details', type: 'PDF', url: 'https://drive.google.com/file/d/PLACEHOLDER_3_1_1/view' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 4,
    title: 'CRITERION IV - INFRASTRUCTURE AND LEARNING RESOURCES',
    sections: [
      {
        id: '4.1',
        title: '4.1 - Physical Facilities',
        items: [
          {
            id: '4.1.1',
            description: 'The Institution has adequate infrastructure and physical facilities for teaching-learning',
            documents: [
              { name: 'Infrastructure Details', type: 'PDF', url: 'https://drive.google.com/file/d/PLACEHOLDER_4_1_1/view' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 5,
    title: 'CRITERION V - STUDENT SUPPORT AND PROGRESSION',
    sections: [
      {
        id: '5.1',
        title: '5.1 - Student Support',
        items: [
          {
            id: '5.1.1',
            description: 'Percentage of students benefited by scholarships and freeships provided by the Government',
            documents: [
              { name: 'Scholarship Details', type: 'PDF', url: 'https://drive.google.com/file/d/PLACEHOLDER_5_1_1/view' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 6,
    title: 'CRITERION VI - GOVERNANCE, LEADERSHIP AND MANAGEMENT',
    sections: [
      {
        id: '6.1',
        title: '6.1 - Institutional Vision and Leadership',
        items: [
          {
            id: '6.1.1',
            description: 'The governance of the institution is reflective of an effective leadership',
            documents: [
              { name: 'Governance Structure', type: 'PDF', url: 'https://drive.google.com/file/d/PLACEHOLDER_6_1_1/view' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 7,
    title: 'CRITERION VII - INSTITUTIONAL VALUES AND BEST PRACTICES',
    sections: [
      {
        id: '7.1',
        title: '7.1 - Institutional Values and Social Responsibilities',
        items: [
          {
            id: '7.1.1',
            description: 'Measures initiated by the Institution for the promotion of gender equity',
            documents: [
              { name: 'Gender Equity Measures', type: 'PDF', url: 'https://drive.google.com/file/d/PLACEHOLDER_7_1_1/view' }
            ]
          }
        ]
      }
    ]
  }
]

export const UserDashboard = () => {
  const [aqarData, setAqarData] = useState(fallbackAqarData)
  const [loading, setLoading] = useState(true)
  const [expandedCriteria, setExpandedCriteria] = useState(null)
  const [expandedSections, setExpandedSections] = useState({})
  const [showResetModal, setShowResetModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' })
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  useEffect(() => {
    fetchDocuments()
    
    // Set up real-time subscription for document updates
    const subscription = supabase
      .channel('aqar_documents_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'aqar_documents' },
        (payload) => {
          console.log('Document change detected:', payload)
          fetchDocuments() // Re-fetch documents when any change occurs
        }
      )
      .subscribe()
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchDocuments = async () => {
    try {
      console.log('📥 UserDashboard: Fetching documents...')
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
      
      console.log('📊 UserDashboard: Fetched documents count:', sortedData?.length)
      console.log('📊 UserDashboard: Sample data:', sortedData?.slice(0, 2))
      
      if (sortedData && sortedData.length > 0) {
        const transformedData = transformDocumentsToAqarData(sortedData)
        console.log('✨ UserDashboard: Transformed criteria count:', transformedData.length)
        setAqarData(transformedData)
      }
    } catch (error) {
      console.error('❌ UserDashboard: Error fetching documents:', error)
      // Keep using fallback data if fetch fails
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e) => {
    e?.preventDefault()
    setResetMessage({ type: '', text: '' })

    if (!newPassword || newPassword.length < 6) {
      setResetMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setResetMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    try {
      setResetLoading(true)
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      // Log password reset activity
      try {
        const { data: userData } = await supabase.auth.getUser()
        const userEmail = userData?.user?.email || ''
        if (userEmail) {
          await supabase.from('activity_logs').insert([
            { email: userEmail, activity: 'password_reset', occurred_at: new Date().toISOString() }
          ])
        }
      } catch (_) {
        // ignore logging errors
      }
      setResetMessage({ type: 'success', text: 'Password updated successfully.' })
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setShowResetModal(false), 1200)
    } catch (err) {
      setResetMessage({ type: 'error', text: err.message || 'Failed to update password.' })
    } finally {
      setResetLoading(false)
    }
  }

  const toggleCriteria = (criteriaId) => {
    setExpandedCriteria(expandedCriteria === criteriaId ? null : criteriaId)
    if (expandedCriteria !== criteriaId) {
      setExpandedSections({})
    }
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-google-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-google-blue-100 border-t-google-blue-600 mb-4"></div>
            <p className="text-google-gray-600">Loading documents...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-google-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-medium text-google-gray-800 mb-2">AQAR</h1>
            <p className="text-google-gray-600">Annual Quality Assurance Report</p>
          </div>
          <button
            onClick={() => { setShowResetModal(true); setResetMessage({ type: '', text: '' }) }}
            className="btn-secondary flex items-center gap-2 h-11"
          >
            <span className="material-icons text-base">lock_reset</span>
            <span>Reset Password</span>
          </button>
        </div>

        <div className="space-y-3">
          {aqarData.map((criteria) => (
            <div key={criteria.id} className="border border-google-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <button
                onClick={() => toggleCriteria(criteria.id)}
                className="w-full bg-gradient-to-r from-google-blue-600 to-google-blue-500 hover:from-google-blue-700 hover:to-google-blue-600 text-white px-6 py-4 flex justify-between items-center transition-all duration-200"
              >
                <span className="font-medium text-left">{criteria.title}</span>
                <span className="material-icons">
                  {expandedCriteria === criteria.id ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {expandedCriteria === criteria.id && (
                <div className="bg-white">
                  {criteria.sections.map((section) => (
                    <div key={section.id} className="border-b border-google-gray-200 last:border-b-0">
                      <div className="bg-google-blue-50 px-6 py-3 border-b border-google-blue-100">
                        <h3 className="font-medium text-google-blue-900">{section.title}</h3>
                      </div>
                      
                      <div className="divide-y divide-google-gray-200">
                        {section.items.map((item) => (
                          <div key={item.id} className="p-6 hover:bg-google-gray-50 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                              <div className="flex-shrink-0 bg-google-gray-100 border border-google-gray-200 p-4 rounded-lg mb-4 md:mb-0 md:w-1/3">
                                <p className="text-sm font-medium text-google-blue-700 mb-2">{item.id}</p>
                                <p className="text-sm text-google-gray-700 leading-relaxed">{item.description}</p>
                              </div>
                              
                              <div className="flex-1">
                                <div className="space-y-2">
                                  {item.documents.map((doc, idx) => (
                                    <a
                                      key={idx}
                                      href={doc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center space-x-3 p-3 bg-google-gray-50 hover:bg-google-blue-50 border border-google-gray-200 hover:border-google-blue-300 rounded-lg cursor-pointer transition-all group"
                                    >
                                      <span className="material-icons text-google-blue-600">
                                        link
                                      </span>
                                      <span className="text-sm text-google-gray-800 flex-1 group-hover:text-google-blue-700 transition-colors">{doc.name}</span>
                                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-google-blue-100 text-google-blue-700">
                                        {doc.type}
                                      </span>
                                      <span className="material-icons text-google-gray-400 group-hover:text-google-blue-600 text-sm">
                                        open_in_new
                                      </span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md border border-google-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-google-gray-800">Reset Password</h3>
              <button onClick={() => setShowResetModal(false)} className="text-google-gray-400 hover:text-google-blue-600">
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter new password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-google-gray-400 hover:text-google-blue-600"
                    aria-label={showNewPwd ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-icons text-base">{showNewPwd ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-google-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Re-enter new password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-google-gray-400 hover:text-google-blue-600"
                    aria-label={showConfirmPwd ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-icons text-base">{showConfirmPwd ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {resetMessage.text && (
                <div className={`${resetMessage.type === 'error' ? 'bg-google-red-50 border-google-red-200 text-google-red-700' : 'bg-google-green-50 border-google-green-200 text-google-green-700'} border px-4 py-3 rounded-lg text-sm`}>
                  {resetMessage.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowResetModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={resetLoading} className="btn-primary">
                  {resetLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

