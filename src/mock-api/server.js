import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routes from './routes.js'

dotenv.config()

const app = express()
const PORT = process.env.MOCK_API_PORT || 3101

app.use(cors())
app.use(express.json())
app.use('/api', routes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`)
  console.log(`  Quickbase endpoints: /api/qb/*`)
  console.log(`  Solvice mock:        /api/solvice/*`)
  console.log(`  AI suggestions:      /api/ai/*`)
})
