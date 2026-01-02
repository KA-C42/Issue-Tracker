// backend/src/api/app.ts

import express from 'express'
import registerRoutes from './registerRoutes.js'

export default function createApp() {
  const app = express()

  app.get('/', (req, res) => {
    res.send('Hello World! :D woohoo!')
  })

  registerRoutes(app)

  return app
}
