import { httpApi } from './http.js'
import { mockApi } from './mock.js'

// No VITE_API_BASE_URL set → run entirely on mock data (no backend needed).
// Set it once a backend (Spring Boot, Node.js, whatever) implements the REST
// contract documented in README.md, and the app switches over unchanged.
const BASE = import.meta.env.VITE_API_BASE_URL

export const api = BASE ? httpApi : mockApi
