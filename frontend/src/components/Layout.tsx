import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { useState } from 'react'

export function Layout() {
  const [pageName, setPageName] = useState('Loading...')

  return (
    <div className="h-screen flex flex-col sm:overflow-hidden">
      <Navbar pageName={pageName} />
      <main className="flex-1 sm:min-h-0 contain-layout">
        <Outlet context={[pageName, setPageName]} />
      </main>
    </div>
  )
}
