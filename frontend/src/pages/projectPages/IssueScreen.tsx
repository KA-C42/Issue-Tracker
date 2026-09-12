import { useState } from 'react'
import { FormDialog } from '@/components/FormDialog'
import { CreateIssueForm } from '@/components/CreateIssueForm'
import { KanbanBoard } from '@/components/KanbanBoard'

export default function IssueScreen() {
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <div className="flex flex-1 min-h-0 flex-col px-10 overflow-hidden">
      <div className="flex items-center justify-center gap-4 m-4">
        <h1 className="text-xl font-semibold text-center">Issues</h1>

        <button onClick={() => setShowCreateForm(true)} className="border p-2">
          New Issue
        </button>
      </div>
      <KanbanBoard />

      {showCreateForm && (
        <FormDialog
          open={showCreateForm}
          setOpen={setShowCreateForm}
          title={'Create Issue'}
          description={''}
        >
          <CreateIssueForm close={() => setShowCreateForm(false)} />
        </FormDialog>
      )}
    </div>
  )
}
