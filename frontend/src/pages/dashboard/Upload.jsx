import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'

export default function Upload() {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [models, setModels] = useState([])
  const [image, setImage] = useState(null)
  const [modelId, setModelId] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')
  const [invalidScan, setInvalidScan] = useState(false)

  useEffect(() => {
    api.get('/models/').then(res => {
      const active = res.data.filter(m => m.status === 'active')
      setModels(active)
      const def = active.find(m => m.is_default) ?? active[0]
      if (def) setModelId(def.id)
    })
  }, [])

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setImage({ file, url: URL.createObjectURL(file) })
    setError('')
  }

  function onDrop(e) { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }
  function onInputChange(e) { handleFile(e.target.files[0]) }
  function removeImage() {
    if (image?.url) URL.revokeObjectURL(image.url)
    setImage(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!image || !modelId) return
    setProcessing(true)
    setError('')

    const steps = ['Preprocessing image…', 'Running model inference…', 'Saving result…']
    for (const msg of steps) {
      setStatusMsg(msg)
      await new Promise(r => setTimeout(r, 600))
    }

    try {
      const form = new FormData()
      form.append('image', image.file)
      form.append('model_id', modelId)
      const res = await api.post('/scans/upload', form)
      navigate(`/results/${res.data.scan_id}`)
    } catch (err) {
      if (err.response?.data?.error === 'invalid_scan') {
        setInvalidScan(true)
      } else {
        setError(err.response?.data?.error || 'Upload failed, please try again')
      }
      setProcessing(false)
    }
  }

  const selectedModel = models.find(m => m.id === modelId)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">New Analysis</h2>
        <p className="text-sm text-slate-500 mt-0.5">Upload a CTA scan image and select a model to run PAD detection.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <p className="text-sm font-semibold text-slate-800 mb-4">CTA Scan Image</p>

          {!image ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-14 cursor-pointer transition-colors select-none ${
                dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
              }`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${dragOver ? 'bg-blue-100' : 'bg-slate-100'}`}>
                <svg className={`w-7 h-7 ${dragOver ? 'text-blue-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-700">Drop image here or <span className="text-blue-600">browse files</span></p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, JPEG, TIFF — max 20 MB</p>
              <input ref={fileRef} type="file" accept="image/*" onChange={onInputChange} className="hidden" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img src={image.url} alt="Upload preview" className="w-full max-h-64 object-contain" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {image.file.name} · {(image.file.size / 1024).toFixed(0)} KB
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-800">Detection Model</p>
          {models.length === 0 ? (
            <p className="text-sm text-slate-400">No active models available.</p>
          ) : (
            <div className="space-y-2">
              {models.map(m => (
                <label
                  key={m.id}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                    modelId === m.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value={m.id}
                    checked={modelId === m.id}
                    onChange={() => setModelId(m.id)}
                    className="mt-0.5 accent-blue-600"
                  />
                  <div>
                    <p className="text-[13.5px] font-semibold text-slate-900">{m.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{m.architecture} · {m.accuracy}% accuracy</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          {selectedModel?.note && (
            <div className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              <span className="font-semibold text-slate-600">Note:</span> {selectedModel.note}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!image || !modelId || processing}
            className="inline-flex items-center gap-2 px-7 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {processing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Analyzing…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Run Detection
              </>
            )}
          </button>
        </div>
      </form>

      {invalidScan && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center w-full max-w-sm">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Invalid Image</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              This does not appear to be a valid medical image. Please upload a valid CTA scan.
            </p>
            <button
              onClick={() => { setInvalidScan(false); removeImage() }}
              className="w-full py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {processing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-10 text-center w-80">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Running PAD Detection</h3>
            <p className="text-sm text-slate-500 min-h-[20px]">{statusMsg}</p>
            <div className="mt-5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
