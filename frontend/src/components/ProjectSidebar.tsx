import { Link, useParams } from 'react-router-dom'
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
  const projectId = useParams().id

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
            {sidebarData.map((button) => (
              <SidebarMenuItem key={button.label}>
                <SidebarMenuButton
                  render={<Link to={'/projects/' + projectId + button.link} />}
                >
                  {button.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
