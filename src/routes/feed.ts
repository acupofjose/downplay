import Podcast from "podcast"
import { Router } from "express"
import { PrismaClient } from ".prisma/client"
import { ensureAuthenticated } from "./guards"
import { ext } from "../util"

const mime = require("mime")

const router = Router()
const prisma = new PrismaClient()

const getSiteUrl = (req: any) => req.protocol + "://" + req.get("host")

/**
 * Returns all of the entities for a given user
 */
router.get("/", ensureAuthenticated, async (req, res, next) => {
  try {
    const result = await prisma.feed.findMany({
      where: { userId: (req.user as any)._id },
      orderBy: { title: "desc" },
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

    const result = await prisma.feed.findFirst({
      where: { id, userId: (req.user as any)._id },
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err })
  }
})
/**
 * Returns a podcast feed for a given feed :id
 */
router.get("/xml/:id", async (req, res, next) => {
  const id = req.params.id
  if (!id) return res.status(400).json({ error: "`id` is required" })

  const feed = await prisma.feed.findFirst({
    where: { id },
  })

  if (!feed) return res.status(400).json({ error: `Feed[${id}] was not found.` })

  const entities = await prisma.entity.findMany({
    where: { feedId: id },
    include: { channel: true },
    orderBy: { publishedAt: "desc" },
  })

  const podcast = new Podcast({
    title: feed.title,
    description: feed.description || "",
    author: feed.author,
    feedUrl: req.protocol + "://" + req.get("host") + req.originalUrl,
    siteUrl: getSiteUrl(req),
    imageUrl: feed.imageUrl || "",
    pubDate: new Date(),
    ttl: 60,
    itunesAuthor: feed.author,
    itunesSubtitle: feed.description || "",
    itunesImage: feed.imageUrl || "",
    language: "en",
  })

  for (const entity of entities) {
    podcast.addItem({
      title: entity.title,
      description: entity.description,
      author: entity.channel?.name,
      url: `${getSiteUrl(req)}/entity/stream/${entity.id}`,
      date: entity.publishedAt,
      itunesImage: `${getSiteUrl(req)}/entity/thumbnail/${entity.id}`,
      enclosure: {
        url: `${getSiteUrl(req)}/entity/stream/${entity.id}`,
        type: mime.getType(ext(entity.path!)),
        file: entity.path!,
      },
    })
  }

  const xml = podcast.buildXml()

  res.set("Content-Type", "text/xml")
  res.send(xml)
})

export default router
