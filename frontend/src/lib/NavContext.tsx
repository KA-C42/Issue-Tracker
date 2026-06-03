import { createContext } from 'react'

export type NavContextType = {
  pageName: string | null

  setPageName: React.Dispatch<React.SetStateAction<string | null>>
}

export const NavContext = createContext<NavContextType | null>(null)
