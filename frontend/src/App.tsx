import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './style.css'
import HealthScreen from './pages/HealthScreen'
import AuthPage from './pages/AuthPage'
import { AuthProvider } from './auth/AuthContextProvider'
import { ProtectedRoute } from './auth/ProtectedRoute'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/health" element={<HealthScreen />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<h1>Hooray! You made it!</h1>} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
