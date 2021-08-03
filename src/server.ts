import * as path from "path"
import express from "express"
import cors from "cors"
import passport from "passport"
import { json, urlencoded } from "body-parser"

import SocketManager from "./socket-manager"
import WorkerManager from "./worker-manager"

import authRoutes from "./routes/auth"
import entityRoutes from "./routes/entity"
import feedRoutes from "./routes/feed"
import queueRoutes from "./routes/queue"
import settingsRoutes from "./routes/settings"

import { migrate } from "./migrator"
import { ensureAdmin, ensureAuthenticated } from "./routes/guards"
import YoutubeAPI from "./providers/youtube-api"

require("dotenv").config()

const PORT = process.env.PORT || 3000

async function start() {
  // Perform necessary dynamic db migrations
  await migrate()

  WorkerManager.init()

  const app = express()

  app.use(cors({ origin: "*" }))
  app.use(json())
  app.use(urlencoded({ extended: true }))
  app.use(passport.initialize())

  // Serve React Client
  const clientPath = path.resolve(__dirname, "..", "client", "dist")
  app.use(express.static(clientPath))
  app.get(/\.(js|css|map|ico)$/, express.static(clientPath))
  app.get("/", (req, res) => res.sendFile(path.join(clientPath, "index.html")))

  app.use("/auth", authRoutes)
  app.use("/entity", entityRoutes)
  app.use("/feed", feedRoutes)
  app.use("/queue", ensureAuthenticated, queueRoutes)
  app.use("/settings", ensureAdmin, settingsRoutes)

  app.use((err: any, req: any, res: any, next: any) => {
    res.status(err.status || 500)
    res.json({ error: err })
  })

  const httpServer = app.listen(PORT, () => console.log(`Listening on ${PORT}`))
  httpServer.on("upgrade", SocketManager.httpServerUpgradeHandler)
}

start()
