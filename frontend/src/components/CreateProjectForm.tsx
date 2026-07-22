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
import { postProject } from '@/api/projects'
import { Spinner } from './ui/spinner'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError, apiErrorToFormDisplay } from '@/api/apiError'

interface CreateProjectFormProps {
  close: () => void
}

const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(20, 'Name must be 20 or fewer characters'),
  description: z
    .string()
    .max(300, 'Description must not exceed 300 characters'),
  code: z.string().length(4, 'Code must be exactly 4 characters'),
})

type FormData = z.infer<typeof createProjectSchema>

export function CreateProjectForm({ close }: CreateProjectFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      code: '',
    },
  })

  const projectPost = useMutation({
    mutationFn: postProject,
    onSuccess: (data) => {
      // TODO: once projects are listed, queryClient.invalidateQueries({ queryKey: ['Projects'] })
      form.reset()
      close()
      toast.success(`Project '${data.name}' successfully created`)
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

  const onSubmit = (data: z.infer<typeof createProjectSchema>) => {
    projectPost.mutate(data)
  }

  return (
    <>
      <form
        id="create-project-form"
        onSubmit={form.handleSubmit(onSubmit)}
      ></form>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="create-project-form-name">
                Project Name
              </FieldLabel>
              <Input
                {...field}
                id="create-project-form-name"
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
              <FieldLabel htmlFor="create-project-form-code">
                Issue Code
              </FieldLabel>
              <Input
                {...field}
                id="create-project-form-code"
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
              <FieldLabel htmlFor="create-project-form-description">
                Description
              </FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  {...field}
                  id="create-project-form-description"
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
        form="create-project-form"
        disabled={projectPost.isPending}
      >
        {projectPost.isPending ? <Spinner /> : 'Submit'}
      </Button>
    </>
  )
}
