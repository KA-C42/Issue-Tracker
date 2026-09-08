import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './style.css'
import HealthScreen from './pages/HealthScreen'
import AuthPage from './pages/AuthPage'
import { AuthContextProvider } from './auth/AuthContextProvider'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import ProjectPage from './pages/ProjectPage'
import IssueScreen from './pages/projectPages/IssueScreen'
import MemberScreen from './pages/projectPages/MemberScreen'
import ProjectDetailsScreen from './pages/projectPages/ProjectDetailsScreen'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
        <Router>
          <Routes>
            <Route path="/health" element={<HealthScreen />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects/:id" element={<ProjectPage />}>
                  <Route index element={<IssueScreen />} />
                  <Route
                    path="/projects/:id/members"
                    element={<MemberScreen />}
                  />
                  <Route
                    path="/projects/:id/details"
                    element={<ProjectDetailsScreen />}
                  />
                </Route>
              </Route>
            </Route>
          </Routes>
        </Router>
      </AuthContextProvider>
    </QueryClientProvider>
  )
}

export default App
