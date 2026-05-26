import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './style.css'
import HealthScreen from './pages/HealthScreen'
import { AuthProvider } from './auth/AuthContextProvider'

const queryClient = new QueryClient()

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<h1>Hooray! You made it!</h1>} />
            <Route path="/health" element={<HealthScreen />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
