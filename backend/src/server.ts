// backend/src/api/server.ts

import createApp from './api/app.js'

const port = 3000

const app = createApp()

app.listen(port, () => {
  console.log(`Issue tracker listening on port ${port}`)
})
