import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api'

function NoteEditor({ note, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note)

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-slate-600 leading-relaxed flex-1">
          {note || <span className="text-slate-300 italic">No note added yet.</span>}
        </p>
        <button onClick={() => setEditing(true)} className="shrink-0 text-[11px] text-blue-600 font-semibold hover:underline">
          Edit
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        rows={2}
        autoFocus
        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        placeholder="Add a note for this model…"
      />
      <div className="flex gap-2">
        <button
          onClick={() => { onSave(draft); setEditing(false) }}
          className="text-[11px] px-2.5 py-1 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
        <button
          onClick={() => { setDraft(note); setEditing(false) }}
          className="text-[11px] px-2.5 py-1 border border-slate-200 text-slate-500 rounded-md hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function AddModelModal({ onClose, onAdd }) {
  const architectures = [
    'ResNet-18', 'ResNet-34', 'ResNet-50', 'ResNet-101', 'ResNet-152',
    'VGG-16', 'VGG-19',
    'AlexNet',
    'EfficientNet-B0', 'EfficientNet-B3', 'EfficientNet-B4', 'EfficientNet-B7',
    'DenseNet-121', 'DenseNet-169', 'DenseNet-201',
    'MobileNet-V2', 'MobileNet-V3-Large', 'MobileNet-V3-Small',
    'SqueezeNet', 'ShuffleNet-V2',
    'ViT-B/16',
  ]
  const [form, setForm] = useState({
    name: '', version: '', architecture: 'ResNet-50', accuracy: '', note: '', modelFile: null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const canSubmit = form.name.trim() && form.version.trim() && form.modelFile

  async function handleAdd() {
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('version', form.version)
      fd.append('architecture', form.architecture)
      if (form.accuracy) fd.append('accuracy', form.accuracy)
      if (form.note) fd.append('note', form.note)
      if (form.modelFile) fd.append('model_file', form.modelFile)
      const res = await api.post('/models/', fd)
      onAdd(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add model')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Add New Model</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Model Name <span className="text-red-400">*</span></label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. PADNet v3.1"
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Version <span className="text-red-400">*</span></label>
          <input value={form.version} onChange={e => set('version', e.target.value)} placeholder="e.g. 3.1.0"
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Architecture</label>
          <select value={form.architecture} onChange={e => set('architecture', e.target.value)}
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {architectures.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Accuracy (%)</label>
          <input type="number" min="0" max="100" step="0.1" value={form.accuracy}
            onChange={e => set('accuracy', e.target.value)} placeholder="e.g. 94.2"
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Note</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2}
            placeholder="Brief description or reference note…"
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Model File</label>
          <label className={`flex items-center gap-3 px-3 py-2.5 border rounded-lg cursor-pointer transition-colors ${
            form.modelFile ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
          }`}>
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-sm text-slate-500 truncate">
              {form.modelFile ? form.modelFile.name : 'Choose file (.pt, .pth, .onnx, .h5)'}
            </span>
            <input type="file" accept=".pt,.pth,.h5,.onnx,.pkl,.bin"
              onChange={e => set('modelFile', e.target.files[0] || null)} className="hidden" />
          </label>
          {form.modelFile && (
            <p className="text-[11px] text-slate-400 mt-1">{(form.modelFile.size / 1024 / 1024).toFixed(1)} MB selected</p>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleAdd}
            disabled={!canSubmit || submitting}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Adding…' : 'Add Model'}
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function ModelCard({ model, isResearcher, onToggle, onSaveNote, onDelete }) {
  const isActive = model.status === 'active'

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 transition-opacity ${isActive ? 'border-slate-200' : 'border-slate-200 opacity-70'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900">{model.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{model.architecture} · v{model.version}</p>
        </div>

        {isResearcher && (
          <button
            onClick={() => onToggle(model.id, isActive ? 'inactive' : 'active')}
            className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </button>
        )}

        {!isResearcher && (
          <span className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded-lg border ${
            isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        )}
      </div>

      {model.accuracy && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-slate-500">Accuracy</span>
          <span className="text-sm font-bold text-blue-600">{model.accuracy}%</span>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Note</p>
        {isResearcher
          ? <NoteEditor note={model.note || ''} onSave={note => onSaveNote(model.id, note)} />
          : <p className="text-xs text-slate-600 leading-relaxed">
              {model.note || <span className="text-slate-300 italic">No note.</span>}
            </p>
        }
      </div>

      {isResearcher && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onDelete(model.id)}
            className="text-[11px] text-red-400 hover:text-red-600 font-semibold hover:underline transition-colors"
          >
            Delete model
          </button>
        </div>
      )}
    </div>
  )
}

export default function Models() {
  const { isResearcher } = useAuth()
  const [models, setModels] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [validationEnabled, setValidationEnabled] = useState(false)

  useEffect(() => {
    api.get('/models/').then(res => setModels(res.data)).finally(() => setLoading(false))
    api.get('/settings/').then(res => setValidationEnabled(res.data.validation_enabled))
  }, [])

  async function toggleValidation() {
    const newVal = !validationEnabled
    try {
      await api.patch('/settings/', { validation_enabled: newVal })
      setValidationEnabled(newVal)
    } catch {
      alert('Could not update validation setting')
    }
  }

  async function toggleStatus(id, newStatus) {
    const res = await api.patch(`/models/${id}`, { status: newStatus })
    setModels(prev => prev.map(m => m.id === id ? res.data : m))
  }

  async function saveNote(id, note) {
    const res = await api.patch(`/models/${id}`, { note })
    setModels(prev => prev.map(m => m.id === id ? res.data : m))
  }

  function handleAdd(newModel) {
    setModels(prev => [...prev, newModel])
  }

  async function deleteModel(id) {
    if (!window.confirm('Delete this model? This cannot be undone.')) return
    try {
      await api.delete(`/models/${id}`)
      setModels(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete model')
    }
  }

  if (loading) return <div className="text-sm text-slate-400 px-1 py-10 text-center">Loading…</div>

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Models</h2>
          <p className="text-sm text-slate-500 mt-0.5">{models.length} model{models.length !== 1 ? 's' : ''} registered</p>
        </div>
        {isResearcher && (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleValidation}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                validationEnabled
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <span className={`w-7 h-4 rounded-full relative transition-colors ${validationEnabled ? 'bg-blue-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${validationEnabled ? 'left-3.5' : 'left-0.5'}`} />
              </span>
              Validation {validationEnabled ? 'On' : 'Off'}
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Model
            </button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {models.map(m => (
          <ModelCard
            key={m.id}
            model={m}
            isResearcher={isResearcher}
            onToggle={toggleStatus}
            onSaveNote={saveNote}
            onDelete={deleteModel}
          />
        ))}
      </div>

      {showAdd && <AddModelModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  )
}
