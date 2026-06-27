import { createContext, useContext } from 'react'

export type NavContextType = {
  pageName: string | null

  setPageName: React.Dispatch<React.SetStateAction<string | null>>
}

export const NavContext = createContext<NavContextType | null>(null)

export function useNavContext() {
  const context = useContext(NavContext)
  if (!context)
    throw new Error('useNavContext must be used within a NavContextProvider')
  return context
}
