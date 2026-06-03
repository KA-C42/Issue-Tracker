import { useState } from 'react'
import type { ReactNode } from 'react'
import { NavContext } from './NavContext'

export function NavContextProvider({ children }: { children: ReactNode }) {
  const [pageName, setPageName] = useState<string | null>(null)

  return (
    <NavContext.Provider
      value={{
        pageName,
        setPageName,
      }}
    >
      {children}
    </NavContext.Provider>
  )
}
