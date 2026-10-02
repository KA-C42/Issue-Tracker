import { Link, useLocation, useParams } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from './ui/sidebar'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'

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

export function ProjectSidebar() {
  const { id: projectId } = useParams()

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
