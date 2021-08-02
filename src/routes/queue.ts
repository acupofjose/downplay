import * as fs from "fs"
import * as path from "path"
import * as util from "util"
import { Router } from "express"
import { Feed as PrismaFeed, PrismaClient, Queue } from "@prisma/client"
import { YoutubedlResult } from "../types"
import youtubedl from "youtube-dl-exec"
import WorkerManager from "../worker-manager"
import { STORAGE_PATH } from "../constants"
import { ensureAuthenticated } from "./guards"

const router = Router()
const prisma = new PrismaClient()

const exists = util.promisify(fs.exists)
const mkdir = util.promisify(fs.mkdir)
const readdir = util.promisify(fs.readdir)
const readfile = util.promisify(fs.readFile)
const unlink = util.promisify(fs.unlink)

/**
 * Inserts an item into the queue for the Workers to pick up.
 *
 * This process requires downloading the youtube-dl json files, parsing them, and inserting them into
 * the database.
 *
 * This endpoint supports (at the moment) single youtube videos and youtube playlists
 */
router.post("/", ensureAuthenticated, async (req, res, next) => {
  const { url, feedId } = req.body
  const results: Queue[] = []

  if (!url) res.status(400).json({ message: "Request must include `url`" })

  try {
    const tempDir = path.join(STORAGE_PATH, "temp")

    if (!(await exists(tempDir))) {
      await mkdir(tempDir)
    }

    console.log(`Retrieving information for ${url}`)

    let feed: PrismaFeed | null = null
    if (feedId) {
      feed = await prisma.feed.findFirst({ where: { id: feedId, userId: (req.user as any)._id } })
    } else {
      feed = await prisma.feed.findFirst({ where: { isDefault: true, userId: (req.user as any)._id } })
    }

    await youtubedl(url as string, {
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      writeInfoJson: true,
      skipDownload: true,
      output: path.join(tempDir, "%(title)s.%(ext)s"),
    })

    for (const file of await readdir(tempDir)) {
      try {
        const filePath = path.join(tempDir, file)

        if (!file.includes(".json")) continue

        console.log(`Reading ${file} into database.`)
        const buffer = await readfile(filePath)
        const json = JSON.parse(buffer.toString()) as YoutubedlResult

        const entity = await prisma.entity.create({
          data: {
            userId: (req.user as any)?._id,
            title: json.title,
            feedId: feed?.id,
            description: json.description,
            channel: json.channel,
            originalUrl: json.webpage_url,
            thumbnailUrl: json.thumbnail,
            JSON: buffer.toString(),
          },
        })

        const queueItem = await WorkerManager.enqueue(entity)
        results.push(queueItem)

        console.log(`Unlinking ${filePath}`)
        await unlink(filePath)
      } catch (err) {
        console.error(err)
      }
    }

    res.json(results)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err })
  }
})

/**
 * Returns all queue items for a given user
 */
router.get("/", ensureAuthenticated, async (req, res, next) => {
  try {
    const result = await prisma.queue.findMany({
      where: { userId: (req.user as any)._id },
      orderBy: { createdAt: "desc" },
      include: { entity: true },
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

/**
 * Returns a specific queue item for a given user
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
 * Deletes a queue item given an :id
 */
router.post("/delete/:id", ensureAuthenticated, async (req, res, next) => {
  try {
    const id = req.params.id
    if (!id) return res.status(400).json({ error: ":id is required" })

    const entity = await prisma.queue.findFirst({
      where: { id, userId: (req.user as any)._id },
      include: { entity: true },
    })

    if (!entity) return res.status(400).json({ error: "Unknown entity" })

    await prisma.queue.delete({ where: { id }, include: { entity: true } })

    return res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

export default router
