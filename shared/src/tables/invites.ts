import { z } from 'zod'
import { idSchema } from '../commonSchemas.js'

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
  id: idSchema,
  status: inviteResponseSchema,
})
export type UpdateInviteInput = z.infer<typeof updateInviteSchema>

export const inviteStatusSchema = z.enum([
  'PENDING',
  ...inviteResponseSchema.options,
])
export type InviteStatus = z.infer<typeof inviteStatusSchema>

export type Invite = CreateInviteInput & {
  id: string
  status: InviteStatus
  sent_at: string
  status_changed_at: string
}
