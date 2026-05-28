import React, { useEffect, useState } from 'react'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const enableAdminPanel = import.meta.env.VITE_SHOW_ADMIN === 'true'

export default function App() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', phone: '', message: '' })
  const [status, setStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [adminMode, setAdminMode] = useState('form')
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken') || '')
  const [adminUser, setAdminUser] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminStatus, setAdminStatus] = useState(null)
  const [submissions, setSubmissions] = useState([])

  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value)
  const validatePhone = (value) => !value || /^[0-9+\-\s()]{7,20}$/.test(value)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)

    if (!form.name.trim() || !form.email.trim()) {
      setStatus({ type: 'error', text: 'Name and email are required' })
      return
    }
    if (!validateEmail(form.email)) {
      setStatus({ type: 'error', text: 'Enter a valid email' })
      return
    }
    if (!validatePhone(form.phone)) {
      setStatus({ type: 'error', text: 'Enter a valid phone number or leave it blank' })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`${apiUrl}/api/form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()

      if (res.ok) {
        setStatus({ type: 'success', text: data.message })
        setForm({ name: '', email: '', subject: '', phone: '', message: '' })
      } else {
        setStatus({ type: 'error', text: data.error || 'Submission failed' })
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'Network error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setAdminStatus(null)
    setIsLoading(true)

    try {
      const res = await fetch(`${apiUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUser, password: adminPassword })
      })
      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('adminToken', data.token)
        setAdminToken(data.token)
        setAdminStatus({ type: 'success', text: 'Logged in successfully' })
      } else {
        setAdminStatus({ type: 'error', text: data.error || 'Login failed' })
      }
    } catch (err) {
      setAdminStatus({ type: 'error', text: 'Network error' })
    } finally {
      setIsLoading(false)
    }
  }

  const loadSubmissions = async () => {
    setAdminStatus(null)
    setSubmissions([])
    setIsLoading(true)

    try {
      const res = await fetch(`${apiUrl}/api/admin/submissions?limit=25`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      const data = await res.json()

      if (res.ok) {
        setSubmissions(data.submissions || [])
      } else {
        setAdminStatus({ type: 'error', text: data.error || 'Unable to load submissions' })
      }
    } catch (err) {
      setAdminStatus({ type: 'error', text: 'Network error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken')
    setAdminToken('')
    setSubmissions([])
    setAdminStatus({ type: 'success', text: 'Logged out successfully' })
  }

  useEffect(() => {
    if (adminToken && adminMode === 'admin' && submissions.length === 0) {
      loadSubmissions()
    }
  }, [adminMode, adminToken])

  return (
    <div className="container">
      <h1>She Can Foundation</h1>
      <p className="intro">Share your story, ask a question, or request support through our secure contact form.</p>

      <div className="tabs">
        <button className={adminMode === 'form' ? 'active' : ''} onClick={() => setAdminMode('form')}>
          Contact form
        </button>
        {enableAdminPanel && (
          <button className={adminMode === 'admin' ? 'active' : ''} onClick={() => setAdminMode('admin')}>
            Admin dashboard
          </button>
        )}
      </div>

      {adminMode === 'form' && (
        <>
          <form onSubmit={handleSubmit} className="form">
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" />
            </label>

            <label>
              Email
              <input name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
            </label>

            <div className="field-row">
              <label>
                Subject
                <input name="subject" value={form.subject} onChange={handleChange} placeholder="Subject of your message" />
              </label>
              <label>
                Phone
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Optional phone number" />
              </label>
            </div>

            <label>
              Message
              <textarea name="message" value={form.message} onChange={handleChange} placeholder="Write your message here" />
            </label>

            <button type="submit" disabled={isLoading}>{isLoading ? 'Sending...' : 'Submit'}</button>
          </form>

          {status && <div className={`status ${status.type}`}>{status.text}</div>}
        </>
      )}

      {adminMode === 'admin' && enableAdminPanel && (
        <section className="admin-panel">
          {!adminToken ? (
            <>
              <h2>Admin login</h2>
              <p className="small">Enter admin credentials to view recent submissions.</p>
              <form onSubmit={handleAdminLogin} className="form">
                <label>
                  Username
                  <input value={adminUser} onChange={(e) => setAdminUser(e.target.value)} placeholder="Admin username" />
                </label>
                <label>
                  Password
                  <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Admin password" />
                </label>
                <button type="submit" disabled={isLoading}>{isLoading ? 'Signing in...' : 'Sign in'}</button>
              </form>
              {adminStatus && <div className={`status ${adminStatus.type}`}>{adminStatus.text}</div>}
            </>
          ) : (
            <>
              <div className="admin-header">
                <div>
                  <h2>Admin dashboard</h2>
                  <p className="small">Recent contact form submissions are shown below.</p>
                </div>
                <div>
                  <button onClick={loadSubmissions} disabled={isLoading} className="secondary">
                    Refresh
                  </button>
                  <button onClick={handleAdminLogout} className="secondary logout">
                    Logout
                  </button>
                </div>
              </div>

              {adminStatus && <div className={`status ${adminStatus.type}`}>{adminStatus.text}</div>}

              {submissions.length === 0 ? (
                <p className="small">No submissions found yet. Click refresh to load the latest messages.</p>
              ) : (
                <div className="submissions">
                  {submissions.map((item) => (
                    <div key={item._id} className="submission-card">
                      <div className="submission-header">
                        <strong>{item.name}</strong>
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="submission-meta">{item.subject || 'General inquiry'}</div>
                      <div className="submission-meta">{item.email}{item.phone ? ` · ${item.phone}` : ''}</div>
                      <p>{item.message || 'No message provided.'}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}
