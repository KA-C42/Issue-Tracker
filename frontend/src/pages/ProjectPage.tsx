import { singleProjectQueryOptions } from '@/api/projects'
import { ProjectSidebar } from '@/components/ProjectSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useQuery } from '@tanstack/react-query'
import { useEffect, type Dispatch, type SetStateAction } from 'react'
import { Outlet, useOutletContext, useParams } from 'react-router-dom'

export default function ProjectPage() {
  const projectId = useParams().id

  const [, setPageName] =
    useOutletContext<[string, Dispatch<SetStateAction<string>>]>()
  const projectQuery = useQuery(singleProjectQueryOptions(projectId ?? ''))

  useEffect(() => {
    if (projectQuery.isLoading) setPageName('Loading...')
    if (projectQuery.isSuccess)
      setPageName(projectQuery.data?.title ?? 'Loading...')
    if (projectQuery.isError) setPageName('project unavailable')
  }, [setPageName, projectQuery])

  if (!projectId) {
    return <div>Project not found</div> // or <Navigate to="/" replace />
  }

  return (
    <div>
      <SidebarProvider className="flex">
        <ProjectSidebar />
        <Outlet />
      </SidebarProvider>
    </div>
  )
}
