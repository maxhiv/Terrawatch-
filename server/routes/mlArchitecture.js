import express from 'express'
const router = express.Router()

router.get('/status', (req, res) => {
  res.json({
    architecture: 'TERRAWATCH ML Architecture v2',
    phases: [
      { phase: 1, name: 'Logistic Regression', status: 'active', runtime: 'Pure JS' },
      { phase: 2, name: 'Random Forest', status: 'pre-wired', runtime: 'Pure JS' },
      { phase: 3, name: 'CNN-LSTM', status: 'pre-wired', runtime: 'Vertex AI' },
    ],
  })
})

export default router
