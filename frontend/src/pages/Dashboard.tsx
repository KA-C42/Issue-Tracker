import { CreateProjectForm } from '@/components/CreateProjectForm'
import { FormDialog } from '@/components/FormDialog'
import { useState } from 'react'

// TODO as separate commit: load username in navbar from dashboard -> useAuth?
export default function Dashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-xl font-semibold">Projects</h1>
        <button onClick={() => setShowCreateForm(true)} className="border p-2">
          New Project
        </button>
      </div>

      {showCreateForm && (
        <FormDialog
          open={showCreateForm}
          setOpen={setShowCreateForm}
          title={'Create Project'}
          description={''}
        >
          <CreateProjectForm close={() => setShowCreateForm(false)} />
        </FormDialog>
      )}
    </div>
  )
}
