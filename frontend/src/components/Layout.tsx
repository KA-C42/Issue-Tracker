import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { useState } from 'react'

export function Layout() {
  const [pageName, setPageName] = useState('Loading...')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar pageName={pageName} />
      <main className="pt-6 contain-layout">
        <Outlet context={[pageName, setPageName]} />
      </main>
    </div>
  )
}
