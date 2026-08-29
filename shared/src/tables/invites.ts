import { z } from 'zod'
import { getByIdSchema, idSchema } from '../commonSchemas'

export const createInviteSchema = z.object({
  sender_id: z.uuid(),
  recipient_id: z.uuid(),
  project_id: z.uuid(),
})
export type CreateInviteInput = z.infer<typeof createInviteSchema>

export const inviteResponseSchema = z.enum(['ACCEPTED', 'REJECTED', 'REVOKED'])

export const inviteRecipientResponseSchema = z.object({
  id: idSchema,
  status: inviteResponseSchema.extract(['ACCEPTED', 'REJECTED']),
})

export const inviteSenderResponseSchema = z.object({
  id: idSchema,
  status: inviteResponseSchema.extract(['REVOKED']),
})

export const updateInviteSchema = z.object({
  id: z.uuid(),
  status: inviteResponseSchema,
})
export type UpdateInviteInput = z.infer<typeof updateInviteSchema>

export const inviteStatusSchema = z.enum([
  'PENDING',
  ...inviteResponseSchema.options,
])
export type InviteStatus = z.infer<typeof inviteStatusSchema>

export type Invite = CreateInviteInput &
  UpdateInviteInput & {
    sent_at: string
    status_changed_at: string
  }
