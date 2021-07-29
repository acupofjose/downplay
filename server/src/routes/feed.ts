import Podcast from "podcast"
import { Router } from "express"
import { PrismaClient } from ".prisma/client"

const router = Router()
const prisma = new PrismaClient()

const getSiteUrl = (req: any) => req.protocol + "://" + req.get("host")

router.get("/:id", async (req, res, next) => {
  const id = req.params.id
  if (!id) return res.status(400).json({ error: "`id` is required" })

  const feed = await prisma.feed.findFirst({ where: { id: parseInt(id) }, include: { entities: true } })

  if (!feed) return res.status(400).json({ error: `Feed[${id}] was not found.` })

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
  })

  for (const entity of feed.entities) {
    podcast.addItem({
      title: entity.title,
      description: entity.description,
      author: entity.channel,
      url: `${getSiteUrl(req)}/entities/stream/${entity.id}`,
      date: entity.createdAt,
    })
  }

  const xml = podcast.buildXml()

  res.set("Content-Type", "text/xml")
  res.send(xml)
})

export default router
