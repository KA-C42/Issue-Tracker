import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { useState } from 'react'

export function Layout() {
  const [pageName, setPageName] = useState('Loading...')

  return (
    <div className="min-h-screen flex flex-col md:overflow-hidden md:h-screen">
      <Navbar pageName={pageName} />
      <main className="flex-1 md:min-h-0 contain-layout">
        <Outlet context={[pageName, setPageName]} />
      </main>
    </div>
  )
}
