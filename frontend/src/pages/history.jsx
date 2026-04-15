import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import API from '../api/axios'
import Result from '../components/result'
import { useToast } from '../components/toastContext'

function History() {
	const navigate = useNavigate()
	const username = localStorage.getItem('username') || 'User'

	const [items, setItems] = useState([])
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [loading, setLoading] = useState(true)
	const { showToast } = useToast()

	useEffect(() => {
		const loadHistory = async () => {
			try {
				setLoading(true)

				const res = await API.get('/api/analyze/history/')
				const historyItems = Array.isArray(res.data) ? res.data : []

				setItems(historyItems)
				setSelectedIndex(0)
			} catch (err) {
				if (err.response?.status === 401) {
					localStorage.removeItem('token')
					localStorage.removeItem('refreshToken')
					localStorage.removeItem('username')
					navigate('/login')
					return
				}

				const message =
					err.response?.data?.error ||
					err.response?.data?.detail ||
					'Unable to load your analysis history.'
				showToast(message, 'error')
			} finally {
				setLoading(false)
			}
		}

		loadHistory()
	}, [navigate, showToast])

	const selectedItem = useMemo(() => items[selectedIndex] || null, [items, selectedIndex])

	const handleLogout = () => {
		localStorage.removeItem('token')
		localStorage.removeItem('refreshToken')
		localStorage.removeItem('username')
		navigate('/login')
	}

	return (
		<div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
			<div className="mx-auto w-full max-w-6xl rounded-3xl border border-cyan-100/70 bg-white/82 p-4 shadow-[0_24px_90px_-34px_rgba(14,116,144,0.55)] backdrop-blur-xl sm:p-6 lg:p-8">
				<div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => navigate('/')}
							className="rounded-full border border-cyan-200 px-4 py-2 text-cyan-800 transition hover:bg-cyan-50"
						>
							Back to Analyzer
						</button>
						<span className="rounded-full bg-cyan-50 px-4 py-2 text-cyan-700">{username}'s History</span>
					</div>

					<button
						className="rounded-full border border-cyan-200 px-4 py-2 text-cyan-800 transition hover:bg-cyan-50"
						onClick={handleLogout}
						type="button"
					>
						Logout
					</button>
				</div>

				<div className="grid gap-5 lg:grid-cols-[320px,1fr] lg:items-start">
					<aside className="rounded-2xl border border-cyan-100 bg-linear-to-b from-white to-sky-50/70 p-3">
						<div className="mb-3 flex items-center justify-between">
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700">Timeline</p>
								<h1 className="bg-[linear-gradient(92deg,#14b8a6,#0ea5e9,#6366f1)] bg-clip-text text-lg font-extrabold tracking-tight text-transparent">History</h1>
							</div>
							<span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-bold text-cyan-800">{items.length}</span>
						</div>

						{loading && <p className="px-2 py-4 text-sm font-medium text-slate-600">Loading history...</p>}

						{!loading && !items.length && (
							<div className="rounded-xl border border-cyan-100 bg-white p-3 text-sm text-slate-600">
								No analyses yet. Run an analysis from the main page to populate this list.
							</div>
						)}

						<div className="max-h-[60vh] space-y-2 overflow-auto pr-1">
							{items.map((item, index) => {
								const isActive = index === selectedIndex
								const createdAt = item.created_at ? new Date(item.created_at) : null
								const description = (item.job_description || '').trim() || 'No job description available'
								const score = Number(item?.result?.scores?.overall ?? item?.result?.score?.overall ?? item?.result?.overall_score ?? 0)
								const scoreBadgeClass =
									score >= 80
										? 'border-emerald-200 bg-emerald-50 text-emerald-700'
										: score >= 60
											? 'border-amber-200 bg-amber-50 text-amber-700'
											: 'border-rose-200 bg-rose-50 text-rose-700'

								return (
									<button
										key={`${item.created_at || 'history'}-${index}`}
										type="button"
										onClick={() => setSelectedIndex(index)}
										className={`w-full rounded-2xl border px-3 py-3 text-left shadow-[0_10px_24px_-18px_rgba(15,23,42,0.35)] transition ${
											isActive
												? 'border-cyan-300 bg-cyan-100/70 shadow-[0_14px_28px_-20px_rgba(8,145,178,0.8)]'
												: 'border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/60 hover:shadow-[0_14px_28px_-20px_rgba(15,23,42,0.45)]'
										}`}
									>
										<div className="flex items-start justify-between gap-3">
											<p className="line-clamp-2 text-sm font-semibold text-slate-900">{description}</p>
											<p className="shrink-0 text-right text-[13px] font-semibold text-cyan-900">
												{createdAt ? createdAt.toLocaleDateString() : 'Unknown'}
												<br />
												<span className="text-xs font-medium text-slate-500">
													{createdAt ? createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
												</span>
											</p>
										</div>
										<div className="mt-2">
											<span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${scoreBadgeClass}`}>
												Score {score}%
											</span>
										</div>
									</button>
								)
							})}
						</div>
					</aside>

					<section className="rounded-2xl border-2 border-cyan-200 bg-white p-4 shadow-[0_22px_48px_-34px_rgba(8,47,73,0.45)] sm:p-5">
						{selectedItem ? (
							<>
								<div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-100 bg-cyan-50/40 px-3 py-2.5">
									<h2 className="bg-[linear-gradient(92deg,#14b8a6,#0ea5e9,#6366f1)] bg-clip-text text-lg font-bold tracking-tight text-transparent">Selected Analysis</h2>
									<p className="text-sm font-semibold text-slate-600">
										{selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString() : ''}
									</p>
								</div>
								<div className="border-t border-cyan-100 pt-4">
									<Result result={selectedItem.result} />
								</div>
							</>
						) : (
							<div className="flex min-h-60 items-center justify-center rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/40 p-6 text-center">
								<p className="text-sm font-medium text-slate-600">Choose an analysis from the sidebar to preview details.</p>
							</div>
						)}
					</section>
				</div>
			</div>
		</div>
	)
}

export default History
