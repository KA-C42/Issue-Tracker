import type { Express } from 'express'
import healthRouter from './routes/health.js'

export default function registerRoutes(app: Express) {
  // add routes here!!
  const routes = [healthRouter]

  for (const route of routes) {
    app.use(route)
  }
}
