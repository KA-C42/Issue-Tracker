import type { Express } from 'express'
import healthRouter from './routes/health.js'
import userRouter from './routes/users.js'

export default function registerRoutes(app: Express) {
  // add routes here!!
  app.use('/health', healthRouter)
  app.use('/users', userRouter)
}
