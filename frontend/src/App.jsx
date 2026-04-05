import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'

// Layout
import AuthLayout from './components/layout/AuthLayout'

// Public page
import Landing  from './pages/public/Landing'
import Login    from './pages/public/Login'
import Signup   from './pages/public/Signup'

// Dashboard pages
import Dashboard    from './pages/dashboard/Dashboard'
import Upload       from './pages/dashboard/Upload'
import Result       from './pages/dashboard/Result'
import History      from './pages/dashboard/History'
import AllDiagnoses from './pages/dashboard/AllDiagnoses'
import Models       from './pages/dashboard/Models'
import Profile      from './pages/dashboard/Profile'

//researchers only
function ResearcherRoute({ children }) {
  const { isResearcher } = useAuth()

  return isResearcher ? children : <Navigate to="/dashboard" replace />
}




// users only (non-researchers)
function UserRoute({ children }) {
  const { isResearcher } = useAuth()
  return !isResearcher ? children : <Navigate to="/dashboard" replace />

}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/*  Public */}
          <Route path="/"        element={<Landing />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/signup"  element={<Signup />} />



          {/*  Authenticated (sidebar + header) */}
          <Route element={<AuthLayout />}>
            {/* Shared pages */}
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/new-analysis" element={<Upload />} />
            <Route path="/results/:id"  element={<Result />} />


            {/* Researcher-only models page */}
            <Route path="/models" element={<ResearcherRoute><Models /></ResearcherRoute>} />
            <Route path="/profile"      element={<Profile />} />

            {/* Researcher-only */}
            <Route path="/diagnoses" element={<ResearcherRoute><AllDiagnoses /></ResearcherRoute>} />

            {/* User-only */}
            <Route path="/history" element={<UserRoute><History /></UserRoute>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
