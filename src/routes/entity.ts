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
const unlink = util.promisify(fs.unlink)
const exists = util.promisify(fs.exists)

/**
 * Returns all of the entities for a given user
 */
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

/**
 * Returns a specific entity given an :id
 */
router.get("/:id", ensureAuthenticated, async (req, res, next) => {
  try {
    const id = req.params.id
    if (!id) res.status(400).json({ error: ":id is required" })

    const result = await prisma.entity.findFirst({
      where: { id, userId: (req.user as any)._id },
      include: { queue: true },
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

/**
 * Deletes an entity with a given :id
 */
router.post("/delete/:id", ensureAuthenticated, async (req, res, next) => {
  try {
    const id = req.params.id
    if (!id) return res.status(400).json({ error: ":id is required" })

    const entity = await prisma.entity.findFirst({
      where: { id, userId: (req.user as any)._id },
      include: { queue: true },
    })

    if (!entity) return res.status(400).json({ error: "Unknown entity" })

    if (entity.thumbnailPath && (await exists(entity.thumbnailPath))) {
      await unlink(entity.thumbnailPath)
    }

    if (entity.path && (await exists(entity.path))) {
      await unlink(entity.path)
    }

    await prisma.entity.delete({ where: { id }, include: { queue: true } })

    return res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

/**
 * Streams a thumbnail for a given :id to the browser
 */
router.get("/thumbnail/:id", async (req, res, next) => {
  const id = req.params.id
  if (!id) res.status(400).json({ error: ":id is required" })
  const result = await prisma.entity.findFirst({
    where: { id },
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

/**
 * Streams an mp3 (with seek capabilities) to the browser
 */
router.get("/stream/:id", async (req, res, next) => {
  try {
    const id = req.params.id
    if (!id) res.status(400).json({ error: ":id is required" })

    const result = await prisma.entity.findFirst({
      where: { id },
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

export default router
