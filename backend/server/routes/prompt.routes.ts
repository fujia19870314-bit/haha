import { Router } from 'express'
import { DailyPromptHandler } from '../../functions/get-daily-prompt.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
const handler = new DailyPromptHandler()

// Get daily prompt - requires authentication
router.get('/get-daily-prompt', authenticate, async (req, res, next) => {
  try {
    const isAnniversary = req.query.isAnniversary === 'true'
    const anniversaryDate = req.query.anniversaryDate as string | undefined
    const forceStage = req.query.forceStage as string | undefined

    const result = await handler.getDailyPrompt({
      userId: req.user!.userId,
      isAnniversary,
      anniversaryDate,
      forceStage: forceStage as any
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// Get all prompts for a stage - requires authentication
router.get('/prompts', authenticate, async (req, res, next) => {
  try {
    const stage = req.query.stage as string
    const isAnniversary = req.query.isAnniversary === 'true'
    const result = await handler.getAllPrompts(stage as any, isAnniversary)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
