import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

import API from '../api/axios'
import { useToast } from '../components/toastContext'

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleLogin = async (event) => {
    event.preventDefault()

    if (!username || !password) {
      showToast('Please enter both username and password.', 'error')
      return
    }

    try {
      setLoading(true)
      const res = await API.post('/api/token/', {
        username,
        password,
      })

      localStorage.setItem('token', res.data.access)
      localStorage.setItem('refreshToken', res.data.refresh)
      localStorage.setItem('username', username.trim())
      showToast('Login successful.', 'success')
      navigate('/')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Login failed.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-cyan-100/70 bg-white/82 p-6 shadow-[0_24px_90px_-34px_rgba(14,116,144,0.55)] backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex items-center justify-between text-sm font-semibold">
          <Link className="rounded-full border border-cyan-200 px-4 py-2 text-cyan-800 transition hover:bg-cyan-50" to="/">
            Home
          </Link>
          <Link className="rounded-full border border-cyan-200 px-4 py-2 text-cyan-800 transition hover:bg-cyan-50" to="/register">
            Register
          </Link>
        </div>

        <h1 className="mb-2 text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Welcome back</h1>
        <p className="mb-8 text-center text-sm font-medium text-slate-600 sm:text-base">Sign in to continue to the resume analyser.</p>

        <form className="space-y-4" onSubmit={handleLogin}>
          <input
            className="w-full rounded-2xl border border-cyan-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-cyan-100"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-cyan-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-cyan-100"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button
            className="w-full rounded-2xl bg-[linear-gradient(90deg,#f97316,#f43f5e,#c026d3)] px-4 py-3 text-sm font-bold tracking-wide text-white shadow-[0_16px_34px_-12px_rgba(225,29,72,0.65)] transition duration-200 hover:bg-[linear-gradient(90deg,#ea580c,#e11d48,#a21caf)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          New here?{' '}
          <Link className="font-semibold text-cyan-700 hover:text-cyan-900" to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login