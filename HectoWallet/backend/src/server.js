// Local/standalone entry point (npm run dev / npm run start). Vercel never
// runs this file — it calls the app directly via api/index.js instead, since
// serverless functions don't call .listen() themselves.
import { app } from './app.js'

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`HectoWallet backend listening on :${port}`))
