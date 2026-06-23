import { useAuth } from '@/auth/UseAuth'
import { useNavContext } from '@/lib/NavContext'

export function Navbar() {
  const { pageName } = useNavContext()

  const { signOutProcess } = useAuth()

  const handleLogout = () => {
    signOutProcess()
  }

  return (
    <nav className="flex justify-between bg-gray-200 border-b border-gray-300 text-lg px-3 py-2">
      <span>Issue Tracker</span>
      <span>{pageName ?? 'Loading...'}</span>
      <button onClick={handleLogout}>Sign Out</button>
    </nav>
  )
}
