import type { Express } from 'express'
import healthRouter from './routes/health.js'

export default function registerRoutes(app: Express) {
  // add routes here!!
  app.use('/health', healthRouter)
}
