import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { test, expect, vi } from 'vitest'
import { CreateIssueForm } from '@/components/CreateIssueForm'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as issuesApi from '@/api/issues'

function renderForm() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[`/projects/${crypto.randomUUID()}/issues`]}
      >
        <Routes>
          <Route
            path="/projects/:id/issues"
            element={<CreateIssueForm close={() => {}} />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

test('submits successfully with valid title', async () => {
  const postIssueSpy = vi
    .spyOn(issuesApi, 'postIssue')
    .mockResolvedValue({ title: 'New issue' } as any)

  const { container } = renderForm()

  fireEvent.change(screen.getByLabelText(/issue title/i), {
    target: { value: 'New issue' },
  })

  const form = container.querySelector('#create-issue-form')!
  fireEvent.submit(form)

  await waitFor(() => {
    expect(postIssueSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New issue' }),
      expect.anything(),
    )
  })
})

test('blocks submission and shows an error when title is empty', async () => {
  renderForm()

  const titleInput = screen.getByLabelText(/issue title/i)
  const submitButton = screen.getByRole('button', { name: /submit/i })
  fireEvent.click(submitButton)

  await waitFor(() => {
    expect(titleInput).toHaveAttribute('aria-invalid', 'true')
  })
})
