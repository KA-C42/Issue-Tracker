import { Link, useLocation, useParams } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from './ui/sidebar'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  Cancel01Icon,
  SidebarLeftIcon,
} from '@hugeicons/core-free-icons'
import { Button } from './ui/button'

type sidebarButton = {
  label: string
  link: string
}

const sidebarData: sidebarButton[] = [
  {
    label: 'Issues',
    link: '', // Issues renders by default via index in Dashboard.tsx
  },
  {
    label: 'Members',
    link: '/members',
  },
  {
    label: 'Details',
    link: '/details',
  },
]

export function ProjectSidebarTrigger() {
  const { isMobile, setOpenMobile } = useSidebar()
  if (!isMobile) return null

  return (
    <Button
      variant="outline"
      size="lg"
      className="self-start"
      onClick={() => setOpenMobile(true)}
    >
      <HugeiconsIcon icon={SidebarLeftIcon} />
      Menu
    </Button>
  )
}

export function ProjectSidebar() {
  const { id: projectId } = useParams()

  const { isMobile, setOpenMobile } = useSidebar()

  const { pathname } = useLocation()

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              className="text-muted-foreground"
              render={<Link to="/" />}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} />
              Dashboard
            </SidebarMenuButton>
            {isMobile && (
              <SidebarMenuAction onClick={() => setOpenMobile(false)}>
                <HugeiconsIcon icon={Cancel01Icon} />
                <span className="sr-only">Close menu</span>
              </SidebarMenuAction>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator className={'w-auto! bg-foreground/20'} />
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {sidebarData.map((button) => {
              const to = '/projects/' + projectId + button.link
              const isActive = pathname === to

              return (
                <SidebarMenuItem key={button.label}>
                  <SidebarMenuButton
                    isActive={isActive}
                    aria-current={isActive ? 'page' : undefined}
                    render={<Link to={to} />}
                    onClick={() => setOpenMobile(false)}
                  >
                    {button.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
