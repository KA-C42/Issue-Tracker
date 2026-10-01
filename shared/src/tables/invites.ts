import { z } from 'zod'
import { idSchema } from '../commonSchemas.js'
import { usernameSchema } from './profiles.js'

// Status

const inviteResponseSchema = z.enum(['ACCEPTED', 'REJECTED', 'REVOKED'])
export type InviteStatus = 'PENDING' | z.infer<typeof inviteResponseSchema>

// Row

export type Invite = {
  id: string
  sender_id: string
  recipient_id: string
  project_id: string
  status: InviteStatus
  sent_at: string
  status_changed_at: string
}

// Requests

export const createInviteSchema = z.object({
  sender_id: idSchema,
  recipient_username: usernameSchema.shape.username,
  project_id: idSchema,
})
export type InviteFields = Pick<
  z.infer<typeof createInviteSchema>,
  'recipient_username'
>

export const inviteRecipientResponseSchema = z.object({
  id: idSchema,
  status: inviteResponseSchema.extract(['ACCEPTED', 'REJECTED']),
})

export const inviteSenderResponseSchema = z.object({
  id: idSchema,
  status: inviteResponseSchema.extract(['REVOKED']),
})
export type RevokeInviteFields = Pick<
  z.infer<typeof inviteSenderResponseSchema>,
  'status'
>

// Read results

// GET /projects/:id/invites: pending invites joined with usernames
export type PendingInvite = Invite & {
  sender_username: string
  recipient_username: string
}
