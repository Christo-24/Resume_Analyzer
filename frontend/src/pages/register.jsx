import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

import API from '../api/axios'
import { useToast } from '../components/toastContext'

function Register() {
	const [formData, setFormData] = useState({
		username: '',
		password: '',
		password2: '',
	})
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()
	const { showToast } = useToast()

	const handleChange = (event) => {
		const { name, value } = event.target
		setFormData((current) => ({ ...current, [name]: value }))
	}

	const handleSubmit = async (event) => {
		event.preventDefault()

		if (!formData.username || !formData.password || !formData.password2) {
			showToast('Please fill in all fields.', 'error')
			return
		}

		try {
			setLoading(true)
			const res = await API.post('/api/user/register/', formData)
			const accessToken = res.data?.access
			const refreshToken = res.data?.refresh
			const username = res.data?.username || formData.username.trim()

			if (!accessToken || !refreshToken) {
				showToast('Registration succeeded but login token is missing.', 'error')
				return
			}

			localStorage.setItem('token', accessToken)
			localStorage.setItem('refreshToken', refreshToken)
			localStorage.setItem('username', username)
			showToast('Account created. You are now logged in.', 'success')
			navigate('/')
		} catch (err) {
			const responseError = err.response?.data
			const backendMessage =
				typeof responseError === 'string'
					? responseError
					: responseError?.error || responseError?.detail || responseError?.username?.[0] || 'Registration failed.'
			showToast(backendMessage, 'error')
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
					<span className="rounded-full bg-cyan-50 px-4 py-2 text-cyan-700">Register</span>
				</div>

				<h1 className="mb-2 text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Create account</h1>
				<p className="mb-8 text-center text-sm font-medium text-slate-600 sm:text-base">Register to access the resume analyser.</p>

				<form className="space-y-4" onSubmit={handleSubmit}>
					<input
						className="w-full rounded-2xl border border-cyan-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-cyan-100"
						name="username"
						placeholder="Username"
						value={formData.username}
						onChange={handleChange}
					/>
					<input
						className="w-full rounded-2xl border border-cyan-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-cyan-100"
						name="password"
						type="password"
						placeholder="Password"
						value={formData.password}
						onChange={handleChange}
					/>
					<input
						className="w-full rounded-2xl border border-cyan-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-cyan-100"
						name="password2"
						type="password"
						placeholder="Confirm password"
						value={formData.password2}
						onChange={handleChange}
					/>

					<button
						className="w-full rounded-2xl bg-[linear-gradient(90deg,#f97316,#f43f5e,#c026d3)] px-4 py-3 text-sm font-bold tracking-wide text-white shadow-[0_16px_34px_-12px_rgba(225,29,72,0.65)] transition duration-200 hover:bg-[linear-gradient(90deg,#ea580c,#e11d48,#a21caf)] disabled:cursor-not-allowed disabled:opacity-60"
						disabled={loading}
						type="submit"
					>
						{loading ? 'Creating account...' : 'Register'}
					</button>
				</form>
			</div>
		</div>
	)
}

export default Register
