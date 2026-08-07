import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <div className="min-h-screen ">
      <Navbar />
      <main className="pt-6">
        <Outlet />
      </main>
    </div>
  )
}
