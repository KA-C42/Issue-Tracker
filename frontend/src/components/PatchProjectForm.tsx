import { Controller, useForm } from 'react-hook-form'
import { Field, FieldError, FieldGroup, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from './ui/input-group'
import { Button } from './ui/button'
import {
  patchProject,
  projectsQueryOptions,
  singleProjectQueryOptions,
} from '@/api/projects'
import { Spinner } from './ui/spinner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError, apiErrorToFormDisplay } from '@/api/apiError'
import {
  projectSchema,
  type Project,
  type ProjectInput,
} from '@issue-tracker/shared'

interface PatchProjectFormProps {
  project: Project
  close: () => void
}

export function PatchProjectForm({ project, close }: PatchProjectFormProps) {
  const queryClient = useQueryClient()

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project.title,
      description: project.description ?? '',
      code: project.code,
    },
  })

  const projectPatch = useMutation({
    mutationFn: patchProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectsQueryOptions.queryKey })
      queryClient.invalidateQueries({
        queryKey: singleProjectQueryOptions(project.id).queryKey,
      })
      close()
      toast.success(`Project '${data.title}' successfully updated`)
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

  const onSubmit = (data: ProjectInput) => {
    projectPatch.mutate({ id: project.id, body: data })
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="patch-project-form-title">
                Project Title
              </FieldLabel>
              <Input
                {...field}
                id="patch-project-form-title"
                placeholder="3-20 characters"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="code"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="patch-project-form-code">
                Issue Code
              </FieldLabel>
              <Input
                {...field}
                id="patch-project-form-code"
                placeholder="4 character issue code prefix (e.g. PROJ)"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="patch-project-form-description">
                Description
              </FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  {...field}
                  id="patch-project-form-description"
                  placeholder="Describe the vision"
                  rows={6}
                  aria-invalid={fieldState.invalid || field.value.length > 300}
                />
                <InputGroupAddon align="block-end">
                  <InputGroupText
                    className={`tabular-nums ${field.value.length > 300 ? 'text-destructive' : ''}`}
                  >
                    {field.value.length}/300 characters
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button
        type="submit"
        variant="outline"
        disabled={!form.formState.isDirty || projectPatch.isPending}
      >
        {projectPatch.isPending ? <Spinner /> : 'Save'}
      </Button>
    </form>
  )
}
