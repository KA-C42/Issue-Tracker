import { Controller, useForm } from 'react-hook-form'
import { Field, FieldError, FieldGroup, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from './ui/input-group'
import { Button } from './ui/button'
import { Spinner } from './ui/spinner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError, apiErrorToFormDisplay } from '@/api/apiError'
import { createIssueSchema, type IssueStatus } from '@issue-tracker/shared'
import { postIssue, projectIssuesQueryOptions } from '@/api/issues'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { useParams } from 'react-router-dom'

const STATUS_ITEMS = [
  { key: 'BACKLOG', value: 'BACKLOG', label: 'Backlog' },
  { key: 'IN_PROGRESS', value: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'DONE', value: 'DONE', label: 'Done' },
] as const satisfies { key: IssueStatus; value: IssueStatus; label: string }[]

interface CreateIssueFormProps {
  close: () => void
}

type FormData = z.infer<typeof createIssueSchema>

export function CreateIssueForm({ close }: CreateIssueFormProps) {
  const { id: project_id } = useParams()

  const form = useForm<FormData>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      project_id: project_id,
      title: '',
      details: '',
      status: 'BACKLOG',
      assignee_id: null,
    },
  })

  const queryClient = useQueryClient()

  const issuePost = useMutation({
    mutationFn: postIssue,
    onSuccess: (data) => {
      form.reset()
      queryClient.invalidateQueries({
        queryKey: projectIssuesQueryOptions(project_id as string).queryKey,
      })
      close()
      toast.success(`Issue '${data.title}' successfully created`)
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const handled = apiErrorToFormDisplay(err.error, form.setError)
        if (!handled) toast.error(err.message)
      } else {
        toast.error('Something went wrong')
      }
    },
  })

  const onSubmit = (data: z.infer<typeof createIssueSchema>) => {
    issuePost.mutate(data)
  }

  return (
    <>
      <form
        id="create-issue-form"
        onSubmit={form.handleSubmit(onSubmit)}
      ></form>
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="create-issue-form-title">
                Issue Title
              </FieldLabel>
              <Input
                {...field}
                id="create-issue-form-title"
                placeholder="At least 1 character(s)"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="details"
          control={form.control}
          render={({ field, fieldState }) => {
            const value = field.value || ''
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="create-issue-form-details">
                  Description
                </FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    {...field}
                    value={value}
                    id="create-issue-form-details"
                    placeholder="Describe the vision"
                    rows={6}
                    aria-invalid={fieldState.invalid || value.length > 300}
                  />
                  <InputGroupAddon align="block-end">
                    <InputGroupText
                      className={`tabular-nums ${value.length > 300 ? 'text-destructive' : ''}`}
                    >
                      {value.length}/300 characters
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )
          }}
        />
        <Controller
          name="status"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="create-issue-form-status">Status</FieldLabel>
              <Select
                items={STATUS_ITEMS}
                defaultValue={'BACKLOG'}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {STATUS_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {/* TODO: Add Select dropdown of possible assignees once projectMembers query created */}
        <Controller
          name="assignee_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="create-issue-form-assignee-id">
                Assignee
              </FieldLabel>
              <Input
                {...field}
                onChange={(e) => field.onChange(e.target.value || null)}
                value={field.value || ''}
                id="create-issue-form-assignee-id"
                placeholder="optional"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button
        type="submit"
        variant="outline"
        form="create-issue-form"
        disabled={issuePost.isPending}
      >
        {issuePost.isPending ? <Spinner /> : 'Submit'}
      </Button>
    </>
  )
}
