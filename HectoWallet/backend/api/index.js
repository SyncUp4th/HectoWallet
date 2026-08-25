// Vercel picks up any file under /api as a serverless function and, for a
// plain Node handler, accepts an Express app directly — it already has the
// (req, res) shape Vercel calls. vercel.json rewrites every /api/* and
// /health request here so Express's own router still sees the full path.
import { app } from '../src/app.js'

export default app
