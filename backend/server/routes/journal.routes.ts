import { Router } from 'express'
import { SubmitJournalHandler } from '../../functions/submit-journal.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
const handler = new SubmitJournalHandler()

// Submit journal - requires authentication
router.post('/submit-journal', authenticate, async (req, res, next) => {
  try {
    const { content, mood } = req.body
    const result = await handler.submitJournal({
      userId: req.user!.userId,
      content,
      mood
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// Get journal history - requires authentication
router.get('/journal-history', authenticate, async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20
    const result = await handler.getJournalHistory(req.user!.userId, limit)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
