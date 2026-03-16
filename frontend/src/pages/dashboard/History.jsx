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

export default function History() {
  const [scans, setScans] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/scans/mine').then(res => setScans(res.data)).finally(() => setLoading(false))
  }, [])

  const filtered = scans.filter(s =>
    filter === 'all' || (filter === 'pad' && s.is_pad) || (filter === 'non-pad' && !s.is_pad)
  )

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">My History</h2>
        <p className="text-sm text-slate-500 mt-0.5">{scans.length} scan{scans.length !== 1 ? 's' : ''} in your history</p>
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
        <p className="text-sm text-slate-500">Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
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
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">File Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Result</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Model Used</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Date & Time</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-14 text-center text-sm text-slate-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <p className="text-sm text-slate-400 mb-2">No scans found.</p>
                    <Link to="/new-analysis" className="text-sm text-blue-600 font-semibold hover:underline">Run your first analysis →</Link>
                  </td>
                </tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-900 max-w-[200px] truncate">{s.file_name}</td>
                  <td className="px-5 py-3.5"><ResultBadge isPAD={s.is_pad} /></td>
                  <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">{s.model_name}</td>
                  <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap hidden md:table-cell">{fmtDateTime(s.created_at)}</td>
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
