import { Router } from 'express'
import { GetResourcesHandler } from '../../functions/get-resources.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()
const handler = new GetResourcesHandler()

// Get resources (therapists + hotlines) - auth optional for now
router.get('/get-resources', optionalAuth, async (req, res, next) => {
  try {
    const city = req.query.city as string | undefined
    const result = await handler.getResources({ city })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
