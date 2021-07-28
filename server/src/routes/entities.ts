import { Router } from "express"
import { PrismaClient } from "@prisma/client"

const router = Router()
const prisma = new PrismaClient()

router.get("/", async (req, res, next) => {
  try {
    const result = await prisma.entity.findMany({ orderBy: { createdAt: "desc" }, include: { queue: true } })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id
    if (!id) res.status(400).json({ error: ":id is required" })

    const result = await prisma.entity.findFirst({ where: { id: parseInt(id) }, include: { queue: true } })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

router.get("/delete/:id", (req, res, next) => {})

export default router
