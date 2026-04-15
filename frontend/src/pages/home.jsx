import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import API from '../api/axios'
import Result from '../components/result'
import Form from '../components/form'
import { useToast } from '../components/toastContext'

function Home() {
  return (
    <HomeContent />
  )
}

export default Home;

function HomeContent() {
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  const username = localStorage.getItem('username') || 'User'
  const isAnalyzeDisabled = !!usage && !usage.is_pro && usage.remaining <= 0

  const fetchUsage = useCallback(async () => {
    try {
      const res = await API.get('/api/usage/')
      if (typeof res.data?.usage_count === 'number' && typeof res.data?.remaining === 'number') {
        setUsage({
          is_pro: !!res.data.is_pro,
          usageCount: res.data.usage_count,
          remaining: res.data.remaining,
        })
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('username')
        navigate('/login')
      }
    }
  }, [navigate])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('username')
    navigate('/login')
  }

  const handleUpgrade = async () => {
    try {
      const res = await API.post('/api/create_order/')
      const options={
        key: res.data.key,
        amount: res.data.amount,
        currency: "INR",
        name: "Resume Analyser Pro",
        description: "Upgrade to Pro for unlimited access",
        order_id: res.data.order_id,
        method:{
          upi: true,
          card: true,
          netbanking: true,
          wallet: true, 
        },
        handler: async function (response) {
          await API.post('/api/verify_payment/', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
           }
          );
          const usageRes = await API.get('/api/usage/');
          setUsage(usageRes.data);
            showToast('Payment successful! Your account has been upgraded to Pro.', 'success');
      },
  };
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error(err)
      const message = err.response?.data?.error || err.response?.data?.detail || err.message || 'Error initiating upgrade.'
      showToast(message, 'error')
    }
  }

  const handleAnalyze = async (file, jobDesc) => {
    if (isAnalyzeDisabled) {
      setResult({ error: 'daily limit reached' })
      return
    }
    const formData = new FormData()
    formData.append('resume', file)
    formData.append('job_description', jobDesc)

    try {
      setLoading(true)
      setResult(null)
      const res = await API.post('/api/analyze/', formData)
      setResult(res.data)
    } catch (err) {
      console.error(err)
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('username')
        navigate('/login')
        return
      }
      const message = err.response?.data?.error || err.response?.data?.detail || err.message || 'Error analyzing resume.'
      const errorData = err.response?.data && typeof err.response.data === 'object'
        ? err.response.data
        : {}
      setResult({ ...errorData, error: errorData.error || message })
    } finally {
      await fetchUsage()
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-cyan-100/70 bg-white/82 p-6 shadow-[0_24px_90px_-34px_rgba(14,116,144,0.55)] backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-end gap-3 text-sm font-semibold">
          <span className="rounded-full bg-cyan-100 px-4 py-2 text-cyan-950">Welcome, {username}</span>
          <button
            className="rounded-full border border-cyan-300 px-4 py-2 text-cyan-900 transition hover:bg-cyan-100"
            onClick={() => navigate('/history')}
            type="button"
          >
            History
          </button>
          {!usage?.is_pro && (
            <button
              className="rounded-full bg-[linear-gradient(90deg,#f59e0b,#f97316)] px-4 py-2 text-white shadow-[0_12px_28px_-12px_rgba(249,115,22,0.8)] transition hover:bg-[linear-gradient(90deg,#d97706,#ea580c)] hover:shadow-[0_14px_32px_-12px_rgba(234,88,12,0.85)]"
              onClick={handleUpgrade}
              type="button"
            >
              Upgrade to Pro
            </button>
          )}

          <button
            className="rounded-full border border-cyan-300 px-4 py-2 text-cyan-900 transition hover:bg-cyan-100"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        </div>

        <p className="mb-2 text-center font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-[0.18em] text-cyan-900">AI Resume Intelligence</p>
        <h1 className="mb-2 bg-[linear-gradient(92deg,#14b8a6,#0ea5e9,#6366f1)] bg-clip-text text-center font-['Plus_Jakarta_Sans'] text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">Resume Analyser</h1>
        <p className="mb-8 text-center text-sm font-semibold text-slate-700 sm:text-base">&quot;Know exactly how your resume stacks up — before the recruiter does. 🎯&quot;</p>

        {usage && (
          <div className="mb-5 overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-[0_14px_42px_-24px_rgba(14,116,144,0.65)]">
            {usage.is_pro ? (
              <div className="bg-[linear-gradient(90deg,#dcfce7,#ecfeff)] px-4 py-3 sm:px-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Plan Status</p>
                <p className="mt-1 text-sm font-bold text-emerald-800 sm:text-base">Pro User • Unlimited access</p>
              </div>
            ) : (
              <div className="bg-[linear-gradient(90deg,#ecfeff,#eff6ff)] px-4 py-3 sm:px-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-900">Daily Usage</p>
                <p className="mt-1 text-sm font-semibold text-slate-700 sm:text-base">
                  Uses left today:{' '}
                  <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-sm font-extrabold text-white">
                    {usage.remaining}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        <Form onAnalyze={handleAnalyze} loading={loading} disabled={isAnalyzeDisabled} />

        {loading && (
          <p className="mt-5 inline-flex items-center rounded-full border border-fuchsia-200 bg-[linear-gradient(90deg,#fff1f2,#fdf4ff)] px-4 py-1.5 text-sm font-semibold text-fuchsia-700">
            Analyzing...
          </p>
        )}

        <Result result={result} />
      </div>
    </div>
  )
}