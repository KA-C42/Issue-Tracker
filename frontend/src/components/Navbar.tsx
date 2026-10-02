import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/UseAuth'

export function Navbar({ pageName }: { pageName: string }) {
  const { signOutProcess } = useAuth()

  const handleLogout = () => {
    signOutProcess()
  }

  return (
    <nav className="sticky top-0 z-50 grid grid-cols-3 items-center border-b bg-background px-3 py-2 text-lg">
      <Link
        to="/"
        className="justify-self-start rounded-sm font-semibold hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Issue Tracker
      </Link>
      <span className="justify-self-center">{pageName}</span>
      <button
        onClick={handleLogout}
        className="justify-self-end border border-gray-400 px-2 py-1 text-sm"
      >
        Sign Out
      </button>
    </nav>
  )
}
