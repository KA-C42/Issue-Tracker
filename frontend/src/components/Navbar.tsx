import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/UseAuth'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useQuery } from '@tanstack/react-query'
import { profileQueryOptions } from '@/api/profiles'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useState } from 'react'
import { FormDialog } from './FormDialog'
import { EditUsernameForm } from './EditUsernameForm'

export function Navbar({ pageName }: { pageName: string }) {
  const { signOutProcess } = useAuth()
  const [showEditUsername, setShowEditUsername] = useState(false)

  const profileQuery = useQuery(profileQueryOptions)

  let displayName = 'Loading...'
  if (profileQuery.data) displayName = profileQuery.data.username
  else if (profileQuery.isError) displayName = 'Account'

  const handleEditProfile = () => {
    setShowEditUsername(true)
  }

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
      <span className="justify-self-center max-w-full truncate">
        {pageName}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" />}
          className="justify-self-end max-w-full text-sm"
        >
          <span className="truncate">{displayName}</span>
          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleEditProfile}>
              Edit Username
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {showEditUsername && (
        <FormDialog
          open={showEditUsername}
          setOpen={setShowEditUsername}
          title={'Edit Username'}
          description={''}
        >
          <EditUsernameForm
            username={profileQuery.data?.username ?? ''}
            close={() => setShowEditUsername(false)}
          />
        </FormDialog>
      )}
    </nav>
  )
}
