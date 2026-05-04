// backend/src/api/app.ts

import express from 'express'
import registerRoutes from './registerRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'
import { AppError } from './errors/AppError.js'
import { authenticateUser } from './middleware/authenticateUser.js'

export default function createApp() {
  const app = express()

  app.use(express.json())

  app.use(authenticateUser)

  registerRoutes(app)

  app.use((req, res, next) => {
    next(new AppError('ROUTE_NOT_FOUND'))
  })

  app.use(errorHandler)

  return app
}
