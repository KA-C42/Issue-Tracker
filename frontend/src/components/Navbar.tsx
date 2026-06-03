import { useContext } from 'react'
import { useAuth } from '@/auth/UseAuth'
import { NavContext } from '@/lib/NavContext'

export function Navbar() {
  // TODO extract null check??
  const context = useContext(NavContext)
  if (!context)
    throw new Error('Navbar must be used within a NavContextProvider')
  const { pageName } = context

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
