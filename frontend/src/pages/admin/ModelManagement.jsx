import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mockModels as initialModels } from '../../data/mockData'

function StatusBadge({ status, isDefault }) {
  if (isDefault) return <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">Default</span>
  return status === 'active'
    ? <span className="px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">Active</span>
    : <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 rounded-full">Inactive</span>
}

export default function ModelManagement() {
  
  const [models, setModels] = useState(initialModels)

  function toggleStatus(id) {
    setModels(prev => prev.map(m =>
      m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m
    ))
  }

  function setDefault(id) {
    setModels(prev => prev.map(m => ({ ...m, isDefault: m.id === id })))
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Model Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">Configure deployed AI models — activate, deactivate, or set a default.</p>
        </div>
        <Link
          to="/admin/models/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Register Model
        </Link>
      </div>

   
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Model</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Accuracy</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Inference</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Updated</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {models.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.architecture} · v{m.version}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={m.status} isDefault={m.isDefault} />
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 bg-slate-100 rounded-full">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${m.accuracy}%` }} />
                      </div>
                      <span className="text-slate-700 font-medium">{m.accuracy}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 hidden lg:table-cell">{m.inferenceTime}</td>
                  <td className="px-5 py-4 text-slate-500 hidden lg:table-cell">{m.updatedAt}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* Set as default — only for active models */}
                      {m.status === 'active' && !m.isDefault && (
                        <button
                          onClick={() => setDefault(m.id)}
                          className="px-3 py-1.5 text-xs font-medium border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Set default
                        </button>
                      )}
                      {/* Toggle active/inactive */}
                      <button
                        onClick={() => toggleStatus(m.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          m.status === 'active'
                            ? 'border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                            : 'border border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {m.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      {/* Edit */}
                      <Link
                        to={`/admin/models/${m.id}/edit`}
                        className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700 flex items-start gap-3">
        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>
          The <strong>Default</strong> model is selected automatically on the Upload page. Only active models can be set as default.
          Deactivated models remain registered but are not available for new analyses.
        </p>
      </div>
    </div>
  )
}
