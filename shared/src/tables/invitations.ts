import { z } from 'zod'

export const createInviteSchema = z.object({
  sender_id: z.uuid(),
  receiver_id: z.uuid(),
  project_id: z.uuid(),
})
export type CreateInviteInput = z.infer<typeof createInviteSchema>

export const inviteStatusUpdateSchema = z.enum([
  'ACCEPTED',
  'REJECTED',
  'REVOKED',
])
export type InviteStatusUpdateOptions = z.infer<typeof inviteStatusUpdateSchema>

export const updateInviteSchema = z.object({
  id: z.uuid(),
  status: inviteStatusUpdateSchema,
})
export type UpdateInviteInput = z.infer<typeof updateInviteSchema>

export const inviteStatusSchema = z.enum([
  'PENDING',
  ...inviteStatusUpdateSchema.options,
])
export type InviteStatus = z.infer<typeof inviteStatusSchema>

export type Invitation = CreateInviteInput &
  UpdateInviteInput & {
    sent_at: string
    status_changed_at: string
  }
