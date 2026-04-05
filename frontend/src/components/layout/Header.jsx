import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const titles = {
  '/dashboard':    'Dashboard',
  '/new-analysis': 'New Analysis',
  '/diagnoses':    'All Diagnoses',
  '/history':      'My History',
  '/models':       'Models',
  '/profile':      'Profile',
}

export default function Header() {
  const { user, isResearcher } = useAuth()
  const { pathname } = useLocation()

  let title = titles[pathname]
  if (!title) {
    if (pathname.startsWith('/results/')) title = 'Analysis Result'
    else title = 'PADScan'
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-[15px] font-semibold text-slate-800">{title}</h1>

      {/* User identity */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-[13px] font-semibold text-slate-900 leading-tight">{user?.name}</p>
          <p className="text-[11px] text-slate-400 leading-tight capitalize">
            {isResearcher ? 'Researcher' : 'User'}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
          {user?.name?.[0]}
        </div>
      </div>
    </header>
  )
}
