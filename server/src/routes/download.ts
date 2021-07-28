import { Router } from "express"
import { PrismaClient } from "@prisma/client"
import { YoutubedlResult } from "../types"
import youtubedl from "youtube-dl-exec"
import WorkerManager from "../worker-manager"

const router = Router()
const prisma = new PrismaClient()

router.post("/create", async (req, res, next) => {
  const { url, audioOnly } = req.body

  if (!url) res.status(400).json({ message: "Request must include `url`" })

  try {
    console.log(`Retrieving information for ${url}`)

    const result = (await youtubedl(url as string, {
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
      extractAudio: audioOnly !== false,
      audioQuality: 0,
      printJson: true,
    })) as YoutubedlResult

    const entity = await prisma.entity.create({
      data: {
        title: result.title,
        description: result.description,
        channel: result.channel,
        filename: result._filename,
        originalUrl: result.webpage_url,
        downloadUrl: result.url,
      },
    })

    const queueItem = await WorkerManager.enqueue(entity)

    res.json({ queueItem })
  } catch (err) {
    res.status(500).json({ message: err })
  }
})

export default router
