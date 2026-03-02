/**
 * Production server for qb-scheduler
 * Serves the built React frontend + mock API from a single process.
 *
 * Usage:
 *   npm run build        (build frontend first)
 *   npm start            (start production server)
 *
 * Railway will run `npm start` automatically after `npm run build`.
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, readdirSync } from 'fs'
import routes from './src/mock-api/routes.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3101

// --- Middleware ---
app.use(cors())
app.use(express.json())

// --- Health check (before other routes so it always responds) ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// --- API routes (mock Quickbase + Solvice + AI) ---
app.use('/api', routes)

// --- Serve built React frontend ---
const distPath = join(__dirname, 'dist')
const indexPath = join(distPath, 'index.html')

if (existsSync(distPath)) {
  console.log(`  dist/ found: ${readdirSync(distPath).join(', ')}`)
  app.use(express.static(distPath))

  // SPA fallback: any non-API route serves index.html
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' })
    }
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('sendFile error:', err.message)
        res.status(500).send('Frontend not available')
      }
    })
  })
} else {
  console.warn('  WARNING: dist/ folder not found — frontend will not be served')
  console.warn(`  Looked in: ${distPath}`)
  console.warn(`  CWD: ${process.cwd()}`)
  console.warn(`  __dirname: ${__dirname}`)
  try {
    console.warn(`  Files in CWD: ${readdirSync(process.cwd()).join(', ')}`)
  } catch (e) { /* ignore */ }
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' })
    }
    res.status(503).json({
      error: 'Frontend not built',
      hint: 'Run npm run build first, or check that the dist/ folder exists',
      distPath,
      cwd: process.cwd(),
    })
  })
}

// --- Start ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`QB Scheduler running on port ${PORT}`)
  console.log(`  Frontend:  http://localhost:${PORT}`)
  console.log(`  API:       http://localhost:${PORT}/api/health`)
  console.log(`  Env:       ${process.env.NODE_ENV || 'development'}`)
})
