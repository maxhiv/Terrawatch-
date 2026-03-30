// server/routes/ai.js
import express from 'express'
import axios from 'axios'
const router = express.Router()

const SYSTEM_PROMPT = `You are the TERRAWATCH AI Field Assistant — an expert environmental intelligence system for Mobile Bay, Alabama and the Gulf Coast.

You have deep expertise in:
- Harmful Algal Blooms (HABs) — especially Karenia brevis ecology, bloom formation, toxicology
- Gulf Coast hypoxia and dissolved oxygen dynamics
- Estuarine water quality (DO₂, pH, salinity, turbidity, nutrients)
- Wetland ecology and Section 404 delineation
- Blue carbon ecosystems and MRV
- PFAS contamination and source attribution
- Microplastic watershed loading
- The Mobile Bay watershed (Dog River, Fowl River, Mobile-Tensaw Delta)
- Gulf Coast commercial fisheries (oysters, shrimp, blue crab, redfish)
- NOAA, EPA, NERRS, USACE regulatory frameworks
- TERRAWATCH capabilities: HAB Oracle, Hypoxia Forecaster, WetlandAI, SITEVAULT

You answer questions from environmental scientists, shellfish farmers, commercial fishers, agency staff, and land developers. Be precise, cite specific science when possible, and always relate answers to practical Gulf Coast applications.

When asked about current conditions, acknowledge you are drawing from real-time TERRAWATCH data feeds. When asked about predictions, explain the methodology.

Tone: Expert, accessible, Gulf Coast-grounded. Never condescending. Always actionable.`

router.post('/query', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(400).json({
      error: 'Anthropic API key not configured',
      hint: 'Add ANTHROPIC_API_KEY to your .env file'
    })
  }

  const { message, context } = req.body
  if (!message) return res.status(400).json({ error: 'Message required' })

  try {
    const userContent = context
      ? `Current environmental context:\n${JSON.stringify(context, null, 2)}\n\nUser question: ${message}`
      : message

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )

    res.json({
      response: response.data.content[0]?.text || '',
      usage: response.data.usage,
    })
  } catch (err) {
    console.error('[AI]', err.response?.data || err.message)
    res.status(500).json({ error: err.response?.data?.error?.message || err.message })
  }
})

export default router
