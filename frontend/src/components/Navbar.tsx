import { useAuth } from '@/auth/UseAuth'
import { useNavContext } from '@/lib/NavContext'

export function Navbar() {
  const { pageName } = useNavContext()

  const { signOutProcess } = useAuth()

  const handleLogout = () => {
    signOutProcess()
  }

  return (
    <nav className="flex items-center justify-between border-b border-gray-300 bg-gray-200 px-3 py-2 text-lg">
      <span>Issue Tracker</span>
      <span>{pageName ?? 'Loading...'}</span>
      <button
        onClick={handleLogout}
        className="border border-gray-400 px-2 py-1 text-sm"
      >
        Sign Out
      </button>
    </nav>
  )
}
