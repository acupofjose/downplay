import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import Config from "../config"
import { ensureAdmin } from "./guards"

const router = Router()
const prisma = new PrismaClient()

router.get("/", ensureAdmin, (req, res, next) => {
  res.json({ ...Config.values })
})

router.post("/", ensureAdmin, async (req, res, next) => {
  const { values } = req.body
  if (!values || typeof values !== "object") return res.status(400).json({ error: "Request must include `values`" })

  const validKeys = Object.keys(Config.values)
  const existingValues: any = { ...Config.values }
  for (const [key, value] of Object.entries(values)) {
    if (validKeys.includes(key)) {
      existingValues[key] = value
    }
  }

  Config.values = existingValues
  await Config.persist()

  return res.json({ success: true })
})

router.get("/status", async (req, res, next) => {
  const adminUser = await prisma.user.findFirst({ where: { isAdmin: true } })

  res.json({ initialized: !!adminUser })
})

export default router
