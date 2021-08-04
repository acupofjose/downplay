import { Router } from "express"
import { PrismaClient } from "@prisma/client"
import { ensureAuthenticated } from "./guards"

const router = Router()
const prisma = new PrismaClient()

router.get("/", ensureAuthenticated, async (req, res, next) => {
  const { _id: id } = req.user as any

  if (!id) return res.status(400).json({ error: `Unable to find user with id: ${id}` })

  const result = await prisma.user.findFirst({ where: { id } })

  if (!result) return res.status(400).json({ error: `Unable to find user with id: ${id}` })

  res.json({ ...result, password: null })
})

export default router
