import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import './App.css'
import HealthScreen from './pages/HealthScreen'

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<h1>Hooray! You made it!</h1>} />
          <Route path="/health" element={<HealthScreen />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
