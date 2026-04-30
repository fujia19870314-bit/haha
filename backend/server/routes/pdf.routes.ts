import { Router } from 'express'
import { GeneratePdfHandler } from '../../functions/generate-pdf.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
const handler = new GeneratePdfHandler()

// Generate PDF memorial book - requires authentication
router.post('/generate-pdf', authenticate, async (req, res, next) => {
  try {
    const result = await handler.generatePdf({
      userId: req.user!.userId
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
