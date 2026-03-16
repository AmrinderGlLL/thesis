import { useAuth } from '../../context/AuthContext'

export default function Profile() {
  const { user, isResearcher } = useAuth()

  const fields = [
    { label: 'Full Name',    value: user?.name },
    { label: 'Email',        value: user?.email },
    { label: 'Role',         value: isResearcher ? 'Researcher' : 'User' },
    ...(user?.institution ? [{ label: 'Institution', value: user.institution }] : []),
    ...(user?.specialty    ? [{ label: 'Specialty',  value: user.specialty  }] : []),
    { label: 'Member Since', value: user?.joinDate },
  ]

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Profile</h2>
        <p className="text-sm text-slate-500 mt-0.5">Your account information</p>
      </div>

      {/* Avatar + name card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl shrink-0">
          {user?.name?.[0]}
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <span className={`mt-2 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            isResearcher ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {isResearcher ? 'Researcher' : 'User'}
          </span>
        </div>
      </div>

      {/* Info fields — static display, no editing needed */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center px-5 py-3.5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-sm font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Info note */}
      <p className="text-xs text-slate-400 text-center">
        Profile details are managed by your institution administrator.
      </p>
    </div>
  )
}
