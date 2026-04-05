import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function PADPositive({ confidence }) {
  return (
    <div className="flex flex-col items-center text-center py-6 px-4">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <span className="inline-block px-5 py-1.5 bg-red-600 text-white text-sm font-bold rounded-full mb-3">PAD Positive</span>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Peripheral Artery Disease Detected</h2>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
        The model has identified indicators consistent with PAD. Clinical evaluation and specialist referral are advised.
      </p>
      {confidence != null && (
        <div className="w-full max-w-xs mt-5">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Model confidence</span>
            <span className="font-bold text-slate-800">{confidence}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${confidence}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

function NonPAD({ confidence }) {
  return (
    <div className="flex flex-col items-center text-center py-6 px-4">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <span className="inline-block px-5 py-1.5 bg-emerald-600 text-white text-sm font-bold rounded-full mb-3">Non-PAD</span>
      <h2 className="text-xl font-bold text-slate-900 mb-2">No PAD Indicators Detected</h2>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
        The model did not find significant indicators of PAD. Routine monitoring remains recommended.
      </p>
      {confidence != null && (
        <div className="w-full max-w-xs mt-5">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Model confidence</span>
            <span className="font-bold text-slate-800">{confidence}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${confidence}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function Result() {
  const { id } = useParams()
  const { isResearcher } = useAuth()
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/scans/${id}`)
      .then(res => setScan(res.data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <p className="text-slate-500">Scan not found.</p>
        <Link to="/dashboard" className="text-blue-600 text-sm font-semibold hover:underline mt-2 inline-block">Back to Dashboard</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link>
        <span>/</span>
        <span className="text-slate-600">Analysis Result</span>
      </div>

      <div className={`bg-white rounded-2xl border-2 shadow-sm ${scan.is_pad ? 'border-red-200' : 'border-emerald-200'}`}>
        {scan.is_pad ? <PADPositive confidence={scan.confidence} /> : <NonPAD confidence={scan.confidence} />}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Submitted Image</p>
          <img
            src={`/api/scans/${id}/image`}
            alt="Submitted scan"
            className="w-full rounded-lg border border-slate-100 object-contain max-h-52 bg-slate-50"
            onError={e => { e.target.style.display = 'none' }}
          />
          {scan.file_name && <p className="text-xs text-slate-400 mt-2 truncate">{scan.file_name}</p>}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Scan Details</p>
          <dl className="space-y-3 text-sm">
            {[
              ['Result',      scan.is_pad ? 'PAD Positive' : 'Non-PAD'],
              ['Confidence',  scan.confidence != null ? `${scan.confidence}%` : '—'],
              ['Severity',    scan.severity || '—'],
              ['File',        scan.file_name || '—'],
              ['Model',       scan.model_name || '—'],
              ['Version',     scan.model_version || '—'],
              ['Date & Time', scan.created_at ? fmtDateTime(scan.created_at) : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-slate-400 shrink-0">{k}</dt>
                <dd className="font-medium text-slate-800 text-right break-all">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-semibold">Research Use Only.</span> This result is generated by an AI model and is intended for research and informational purposes only. It does not constitute a medical diagnosis. Always consult a qualified healthcare professional before making any clinical decisions.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/new-analysis" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
          New Analysis
        </Link>
        <Link to="/history" className="px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">
          My History
        </Link>
        <button onClick={() => window.print()} className="px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">
          Print
        </button>
        {isResearcher && (
          <a
            href={`/api/scans/${id}/image`}
            download={scan?.file_name || 'scan'}
            className="px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Download Image
          </a>
        )}
      </div>
    </div>
  )
}
