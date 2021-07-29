import * as fs from "fs"
import * as path from "path"
import * as util from "util"
import { Router } from "express"
import { Feed, PrismaClient, Queue } from "@prisma/client"
import { YoutubedlResult } from "../types"
import youtubedl from "youtube-dl-exec"
import WorkerManager from "../worker-manager"
import { STORAGE_PATH } from "../constants"

const router = Router()
const prisma = new PrismaClient()

const exists = util.promisify(fs.exists)
const mkdir = util.promisify(fs.mkdir)
const readdir = util.promisify(fs.readdir)
const readfile = util.promisify(fs.readFile)
const unlink = util.promisify(fs.unlink)

router.post("/create", async (req, res, next) => {
  const { url, audioOnly, feedId } = req.body
  const results: Queue[] = []

  if (!url) res.status(400).json({ message: "Request must include `url`" })

  try {
    const tempDir = path.join(STORAGE_PATH, "temp")

    if (!(await exists(tempDir))) {
      await mkdir(tempDir)
    }

    console.log(`Retrieving information for ${url}`)

    let feed: Feed | null = null
    if (feedId) {
      feed = await prisma.feed.findFirst({ where: { id: feedId } })
    } else {
      feed = await prisma.feed.findFirst({ where: { isDefault: true } })
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

export default router
