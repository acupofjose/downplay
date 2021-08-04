import { Router } from "express"
import { PrismaClient } from ".prisma/client"
import { ensureAuthenticated } from "./guards"

const router = Router()
const prisma = new PrismaClient()

const getSiteUrl = (req: any) => req.protocol + "://" + req.get("host")

/**
 * Returns all of the entities for a given user
 */
router.get("/", ensureAuthenticated, async (req, res, next) => {
  try {
    const result = await prisma.channel.findMany({
      where: { userId: (req.user as any)._id },
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

/**
 * Returns a specific entity given an :id
 */
router.get("/:id", ensureAuthenticated, async (req, res, next) => {
  try {
    const id = req.params.id
    if (!id) res.status(400).json({ error: ":id is required" })

    const result = await prisma.channel.findFirst({
      where: { id, userId: (req.user as any)._id },
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

export default router
