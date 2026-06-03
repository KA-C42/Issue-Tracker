import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './style.css'
import HealthScreen from './pages/HealthScreen'
import AuthPage from './pages/AuthPage'
import { AuthContextProvider } from './auth/AuthContextProvider'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Layout } from './components/Layout'
import { NavContextProvider } from './lib/NavContextProvider'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
        <NavContextProvider>
          <Router>
            <Routes>
              <Route path="/health" element={<HealthScreen />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<h1>Hooray! You made it!</h1>} />
                </Route>
              </Route>
            </Routes>
          </Router>
        </NavContextProvider>
      </AuthContextProvider>
    </QueryClientProvider>
  )
}

export default App
