import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { mockModels } from '../../data/mockData'

const ARCHITECTURES = ['ResNet-50', 'ResNet-101', 'VGG-16', 'EfficientNet-B4', 'DenseNet-121', 'ViT-B/16', 'Custom']

export default function ModelForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  // Pre-fill form when editing
  const existing = isEdit ? mockModels.find(m => m.id === id) : null

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    version: existing?.version ?? '',
    architecture: existing?.architecture ?? 'ResNet-50',
    description: existing?.description ?? '',
    accuracy: existing?.accuracy ?? '',
    sensitivity: existing?.sensitivity ?? '',
    specificity: existing?.specificity ?? '',
    auc: existing?.auc ?? '',
    inferenceTime: existing?.inferenceTime ?? '',
    trainingSamples: existing?.trainingSamples ?? '',
    status: existing?.status ?? 'inactive',
    isDefault: existing?.isDefault ?? false,
    tags: existing?.tags?.join(', ') ?? '',
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    setErrors(err => ({ ...err, [name]: undefined }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.version.trim()) e.version = 'Version is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (form.accuracy && (form.accuracy < 0 || form.accuracy > 100)) e.accuracy = 'Must be 0–100'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    navigate('/admin/models')
  }

  // Field helper
  const field = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
          errors[name] ? 'border-red-300 bg-red-50' : 'border-slate-200'
        }`}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link to="/admin/models" className="hover:text-blue-600 transition-colors">Model Management</Link>
        <span>/</span>
        <span className="text-slate-700">{isEdit ? `Edit ${existing?.name ?? id}` : 'Register New Model'}</span>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Model' : 'Register New Model'}</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {isEdit ? 'Update model configuration and metadata.' : 'Add a new AI model to the platform.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Identity ────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h3 className="font-semibold text-slate-900">Model Identity</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            {field('name', 'Model Name', 'text', 'e.g. PADNet v3.0')}
            {field('version', 'Version', 'text', 'e.g. 3.0.0')}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Architecture</label>
            <select
              name="architecture"
              value={form.architecture}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {ARCHITECTURES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the model, training approach, and intended use…"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>
          {field('tags', 'Tags', 'text', 'e.g. production, v3, experimental (comma-separated)')}
        </div>

        {/* ── Performance metrics ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h3 className="font-semibold text-slate-900">Performance Metrics</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            {field('accuracy', 'Accuracy (%)', 'number', '0–100')}
            {field('sensitivity', 'Sensitivity (%)', 'number', '0–100')}
            {field('specificity', 'Specificity (%)', 'number', '0–100')}
            {field('auc', 'AUC-ROC', 'number', '0.0–1.0')}
            {field('inferenceTime', 'Avg. Inference Time', 'text', 'e.g. 1.2s')}
            {field('trainingSamples', 'Training Samples', 'number', 'e.g. 15000')}
          </div>
        </div>

        {/* ── Deployment config ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Deployment</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Initial Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="active">Active — available for analyses</option>
              <option value="inactive">Inactive — registered but disabled</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isDefault"
              checked={form.isDefault}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <div>
              <p className="text-sm font-medium text-slate-700">Set as default model</p>
              <p className="text-xs text-slate-400">This model will be pre-selected on the upload page.</p>
            </div>
          </label>
        </div>

        {/* ── Submit actions ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </>
            ) : (isEdit ? 'Save changes' : 'Register model')}
          </button>
          <Link
            to="/admin/models"
            className="px-6 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
