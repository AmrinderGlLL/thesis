import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function ResultBadge({ isPAD }) {
  return isPAD
    ? <span className="px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700 border border-red-200 rounded-full">PAD Positive</span>
    : <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full">Non-PAD</span>
}

export default function AllDiagnoses() {
  const [scans, setScans] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/scans/all').then(res => setScans(res.data)).finally(() => setLoading(false))
  }, [])

  const filtered = scans.filter(s => {
    const q = search.toLowerCase()
    const matches = !q ||
      s.user_name?.toLowerCase().includes(q) ||
      s.user_email?.toLowerCase().includes(q) ||
      s.file_name?.toLowerCase().includes(q)
    const byResult = filter === 'all' || (filter === 'pad' && s.is_pad) || (filter === 'non-pad' && !s.is_pad)
    return matches && byResult
  })

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">All Diagnoses</h2>
        <p className="text-sm text-slate-500 mt-0.5">{scans.length} total scans across all patients</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or file…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
          {[['all', 'All'], ['pad', 'PAD+'], ['non-pad', 'Non-PAD']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">File</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Result</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Model</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Date & Time</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">No diagnoses found.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{s.user_name}</td>
                  <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">{s.user_email}</td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-[160px] truncate hidden md:table-cell">{s.file_name}</td>
                  <td className="px-5 py-3.5"><ResultBadge isPAD={s.is_pad} /></td>
                  <td className="px-5 py-3.5 text-slate-500 hidden lg:table-cell">{s.model_name}</td>
                  <td className="px-5 py-3.5 text-slate-500 hidden lg:table-cell whitespace-nowrap">{fmtDateTime(s.created_at)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link to={`/results/${s.id}`} className="text-xs text-blue-600 font-semibold hover:underline">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
