import type { Express } from 'express'
import profileRouter from './routes/profiles.js'
import projectRouter from './routes/projects.js'
import issueRouter from './routes/issues.js'
import commentRouter from './routes/comments.js'
import invitationRouter from './routes/invitations.js'

export default function registerAuthRoutes(app: Express) {
  // add auth protected routes here!!
  app.use('/profiles', profileRouter)
  app.use('/projects', projectRouter)
  app.use('/projects/:project_id/issues', issueRouter)
  app.use('/issues', issueRouter)
  app.use('/issues/:issue_id/comments', commentRouter)
  app.use('/comments', commentRouter)
  app.use('/projects/:project_id/invitations', invitationRouter)
  app.use('/invitations', invitationRouter)
}
