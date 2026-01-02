import { Router } from 'express'

const healthRouter = Router()

healthRouter.get('/health', (req, res) => {
  res.status(200).json({ connection: "just fine n' dandy" })
})

export default healthRouter
