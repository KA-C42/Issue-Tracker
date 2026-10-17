import { Controller, useForm } from 'react-hook-form'
import { Field, FieldError, FieldGroup, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from './ui/button'
import { Spinner } from './ui/spinner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError, apiErrorToFormDisplay } from '@/api/apiError'
import { usernameSchema, type UpdateProfileInput } from '@issue-tracker/shared'
import { patchUsername, profileQueryOptions } from '@/api/profiles'

interface EditUsernameFormProps {
  username: string
  close: () => void
}

export function EditUsernameForm({ username, close }: EditUsernameFormProps) {
  const queryClient = useQueryClient()

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: username,
    },
  })

  const usernameEdit = useMutation({
    mutationFn: patchUsername,
    onSuccess: (data) => {
      form.reset()
      queryClient.invalidateQueries({ queryKey: profileQueryOptions.queryKey })
      queryClient.invalidateQueries({ queryKey: ['project-contributors'] })
      queryClient.setQueryData(profileQueryOptions.queryKey, data)
      close()
      toast.success(`Username successfully updated!`)
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

  const onSubmit = (data: UpdateProfileInput) => {
    usernameEdit.mutate(data)
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <FieldGroup>
        <Controller
          name="username"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="edit-username-form-input">
                Username
              </FieldLabel>
              <Input
                {...field}
                id="edit-username-form-input"
                placeholder="3-20 characters"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button type="submit" variant="outline" disabled={usernameEdit.isPending}>
        {usernameEdit.isPending ? <Spinner /> : 'Submit'}
      </Button>
    </form>
  )
}
