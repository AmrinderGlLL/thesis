import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ResultBadge({ isPAD }) {
  return isPAD
    ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">PAD Positive</span>
    : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Non-PAD</span>
}

function ResearcherDashboard({ user }) {
  const [recentScans, setRecentScans] = useState([])
  const [activeModels, setActiveModels] = useState([])

  useEffect(() => {
    api.get('/scans/all').then(res => setRecentScans(res.data.slice(0, 5)))
    api.get('/models/').then(res => setActiveModels(res.data.filter(m => m.status === 'active')))
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Welcome back, {user.name.split(' ').slice(1).join(' ') || user.name}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{user.institution}{user.specialty ? ` · ${user.specialty}` : ''}</p>
        </div>
        <Link
          to="/new-analysis"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Analysis
        </Link>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Recent Diagnoses</h3>
            <Link to="/diagnoses" className="text-xs text-blue-600 font-medium hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentScans.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">No diagnoses yet.</p>
            ) : recentScans.map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{s.user_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{s.file_name} · {fmtDate(s.created_at)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <ResultBadge isPAD={s.is_pad} />
                  <Link to={`/results/${s.id}`} className="text-[11px] text-blue-600 font-medium hover:underline">View</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'New Analysis', sub: 'Run a scan now', to: '/new-analysis', blue: true },
                { label: 'All Diagnoses', sub: 'View all patient results', to: '/diagnoses', blue: false },
                { label: 'Manage Models', sub: 'Add or edit model notes', to: '/models', blue: false },
              ].map(({ label, sub, to, blue }) => (
                <Link key={to} to={to} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${blue ? 'border-blue-100 bg-blue-50 hover:bg-blue-100' : 'border-slate-100 hover:bg-slate-50'}`}>
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${blue ? 'bg-blue-600' : 'bg-slate-100'}`}>
                    <svg className={`w-3.5 h-3.5 ${blue ? 'text-white' : 'text-slate-500'}`} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-[13px] font-semibold ${blue ? 'text-blue-700' : 'text-slate-700'}`}>{label}</p>
                    <p className={`text-[11px] ${blue ? 'text-blue-500' : 'text-slate-400'}`}>{sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">Active Models</h3>
              <Link to="/models" className="text-[11px] text-blue-600 hover:underline">Manage →</Link>
            </div>
            <div className="space-y-2">
              {activeModels.length === 0 ? (
                <p className="text-xs text-slate-400">No active models.</p>
              ) : activeModels.map(m => (
                <div key={m.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-[12.5px] font-medium text-slate-800">{m.name}</p>
                    <p className="text-[11px] text-slate-400">v{m.version}{m.accuracy ? ` · ${m.accuracy}% acc` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UserDashboard({ user }) {
  const [recentScans, setRecentScans] = useState([])

  useEffect(() => {
    api.get('/scans/mine').then(res => setRecentScans(res.data.slice(0, 4)))
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Welcome back, {user.name.split(' ')[0]}</h2>
          <p className="text-sm text-slate-500 mt-0.5">Ready to run a new scan?</p>
        </div>
        <Link
          to="/new-analysis"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Analysis
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Recent Scans</h3>
          <Link to="/history" className="text-xs text-blue-600 font-medium hover:underline">View all →</Link>
        </div>
        {recentScans.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-slate-400">No scans yet.</p>
            <Link to="/new-analysis" className="text-sm text-blue-600 font-medium hover:underline mt-1 inline-block">Run your first analysis →</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentScans.map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{s.file_name}</p>
                  <p className="text-[11px] text-slate-400">{s.model_name} · {fmtDate(s.created_at)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <ResultBadge isPAD={s.is_pad} />
                  <Link to={`/results/${s.id}`} className="text-[11px] text-blue-600 font-medium hover:underline">View</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, isResearcher } = useAuth()
  return isResearcher ? <ResearcherDashboard user={user} /> : <UserDashboard user={user} />
}
