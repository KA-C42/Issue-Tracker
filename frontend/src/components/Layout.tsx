import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { useState } from 'react'

export function Layout() {
  const [pageName, setPageName] = useState('Loading...')

  return (
    <div className="min-h-screen ">
      <Navbar pageName={pageName} />
      <main className="pt-6">
        <Outlet context={[pageName, setPageName]} />
      </main>
    </div>
  )
}
