import type { Express } from 'express'
import healthRouter from './routes/health.js'
import userRouter from './routes/users.js'
import projectRouter from './routes/projects.js'
import projectContributorRouter from './routes/project_contributors.js'
import issueRouter from './routes/issues.js'
import commentRouter from './routes/comments.js'

export default function registerRoutes(app: Express) {
  // add routes here!!
  app.use('/health', healthRouter)
  app.use('/users', userRouter)
  app.use('/projects', projectRouter)
  app.use('/project-contributors', projectContributorRouter)
  app.use('/projects/:project_id/issues', issueRouter)
  app.use('/issues', issueRouter)
  app.use('/issues/:issue_id/comments', commentRouter)
  app.use('/comments', commentRouter)
}
