import { Link, useParams } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
