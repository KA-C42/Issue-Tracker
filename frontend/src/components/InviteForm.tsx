import { Controller, useForm } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from './ui/button'
import { Spinner } from './ui/spinner'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError, apiErrorToFormDisplay } from '@/api/apiError'
import { createInviteSchema } from '@issue-tracker/shared'
import { postInvite } from '@/api/invites'

interface InviteFormProps {
  projectId: string
}

// sender_id and project_id are filled in server-side
const inviteFormSchema = createInviteSchema.pick({ recipient_username: true })

type FormData = z.infer<typeof inviteFormSchema>

export function InviteForm({ projectId }: InviteFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      recipient_username: '',
    },
  })

  const invitePost = useMutation({
    mutationFn: postInvite,
    onSuccess: (_data, variables) => {
      form.reset()
      toast.success(`Invite to '${variables.username}' successfully sent`)
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

  const onSubmit = (data: FormData) => {
    invitePost.mutate({ projectId, username: data.recipient_username })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Controller
        name="recipient_username"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="invite-form-username">Username</FieldLabel>
            <div className="flex gap-2">
              <Input
                {...field}
                id="invite-form-username"
                placeholder="3-20 characters"
                aria-invalid={fieldState.invalid}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={invitePost.isPending}
              >
                {invitePost.isPending ? <Spinner /> : 'Send'}
              </Button>
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </form>
  )
}
