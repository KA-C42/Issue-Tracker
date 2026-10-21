// backend/src/server.ts

import 'dotenv/config'
import createApp from './api/app.js'

const app = createApp()

const port = Number(process.env.PORT) || 3000
app.listen(port, '0.0.0.0', () => console.log(`API listening on ${port}`))
