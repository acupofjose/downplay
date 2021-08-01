import * as util from "util"
import * as fs from "fs"
import { Router } from "express"
import { PrismaClient } from "@prisma/client"
import { ensureAuthenticated } from "./guards"
import { ext } from "../util"

const mime = require("mime/lite")
const router = Router()
const prisma = new PrismaClient()

const stat = util.promisify(fs.stat)

router.get("/", ensureAuthenticated, async (req, res, next) => {
  try {
    const result = await prisma.entity.findMany({
      where: { userId: (req.user as any)._id },
      orderBy: { createdAt: "desc" },
      include: { queue: true },
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

router.get("/:id", ensureAuthenticated, async (req, res, next) => {
  try {
    const id = req.params.id
    if (!id) res.status(400).json({ error: ":id is required" })

    const result = await prisma.entity.findFirst({
      where: { id: parseInt(id), userId: (req.user as any)._id },
      include: { queue: true },
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

router.get("/thumbnail/:id", async (req, res, next) => {
  const id = req.params.id
  if (!id) res.status(400).json({ error: ":id is required" })
  const result = await prisma.entity.findFirst({
    where: { id: parseInt(id) },
    include: { queue: true },
  })

  if (result && result.thumbnailPath) {
    const stats = await stat(result.thumbnailPath)
    const total = stats.size
    res.writeHead(200, { "Content-Length": total, "Content-Type": mime.getType(ext(result.thumbnailPath)) })
    fs.createReadStream(result.thumbnailPath).pipe(res)
  } else {
    res.status(400).json({ error: `Could not find a thumbnail for entity with id ${id}` })
  }
})

router.get("/stream/:id", async (req, res, next) => {
  try {
    const id = req.params.id
    if (!id) res.status(400).json({ error: ":id is required" })

    const result = await prisma.entity.findFirst({
      where: { id: parseInt(id) },
      include: { queue: true },
    })

    if (result && result.path) {
      const stats = await stat(result.path)
      const total = stats.size

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
          "Content-Type": mime.getType(ext(result.path)),
        })
        readStream.pipe(res)
      } else {
        res.writeHead(200, { "Content-Length": total, "Content-Type": mime.getType(ext(result.path)) })
        fs.createReadStream(result.path).pipe(res)
      }
    } else {
      res.status(400).json({ error: `Could not find an entity with id ${id}` })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err })
  }
})

router.get("/delete/:id", (req, res, next) => {})

export default router
