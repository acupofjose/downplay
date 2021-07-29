import * as fs from "fs"
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

router.get("/stream/:id", async (req, res, next) => {
  try {
    const id = req.params.id
    if (!id) res.status(400).json({ error: ":id is required" })

    const result = await prisma.entity.findFirst({ where: { id: parseInt(id) }, include: { queue: true } })

    if (result && result.path) {
      const stat = fs.statSync(result.path)
      const total = stat.size

      if (req.headers.range) {
        var range = req.headers.range
        var parts = range.replace(/bytes=/, "").split("-")
        var partialstart = parts[0]
        var partialend = parts[1]
        var start = parseInt(partialstart, 10)
        var end = partialend ? parseInt(partialend, 10) : total - 1
        var chunksize = end - start + 1
        var readStream = fs.createReadStream(result.path, { start: start, end: end })
        res.writeHead(206, {
          "Content-Range": "bytes " + start + "-" + end + "/" + total,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": "audio/mpeg",
        })
        readStream.pipe(res)
      } else {
        res.writeHead(200, { "Content-Length": total, "Content-Type": "audio/mpeg" })
        fs.createReadStream(result.path).pipe(res)
      }
    } else {
      res.status(400).json({ error: `Could not find an entity with id ${id}` })
    }
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

router.get("/delete/:id", (req, res, next) => {})

export default router
