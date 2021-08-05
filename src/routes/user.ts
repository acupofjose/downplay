import { Router } from "express"
import { PrismaClient } from "@prisma/client"
import { ensureAuthenticated } from "./guards"
import { compare, hash } from "../util"

const router = Router()
const prisma = new PrismaClient()

router.get("/", ensureAuthenticated, async (req, res, next) => {
  const { _id: id } = req.user as any

  if (!id) return res.status(400).json({ error: `Unable to find user with id: ${id}` })

  const result = await prisma.user.findFirst({ where: { id } })

  if (!result) return res.status(400).json({ error: `Unable to find user with id: ${id}` })

  res.json({ ...result, password: null })
})

router.post("/change-password", ensureAuthenticated, async (req, res, next) => {
  if (!req.user) return res.status(500).json({ error: "User has not been assigned to internal parameters." })

  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: "Method requires `currentPassword` and `newPassword`" })

  const { id, username } = req.user as any
  const user = await prisma.user.findFirst({ where: { id, username } })

  if (!user) return res.status(500).json({ error: "User has not found." })

  if (!(await compare(currentPassword, user.password))) {
    return res.status(403).json({ error: "Current password is incorrect." })
  }

  const hashedPassword = await hash(newPassword)

  await prisma.user.update({ where: { id, username }, data: { password: hashedPassword } })

  return res.json({ success: true })
})

export default router
