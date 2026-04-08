import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'

export function applyMiddleware(app) {
  app.set('trust proxy', 1)
  app.use(cors({ origin: '*' }))
  app.use(express.json())

  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true })
  app.use('/api', limiter)
}
