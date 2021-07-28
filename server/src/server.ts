import express from "express"
import SocketManager from "./socket-manager"
import { json, urlencoded } from "body-parser"
import cors from "cors"

import downloadRoutes from "./routes/download"
import entityRoutes from "./routes/entities"
import queueRoutes from "./routes/queue"

const PORT = process.env.PORT || 3000

const app = express()

app.use(cors({ origin: "*" }))
app.use(json())
app.use(urlencoded({ extended: true }))

app.use("/download", downloadRoutes)
app.use("/entities", entityRoutes)
app.use("/queue", queueRoutes)

const httpServer = app.listen(PORT, () => console.log(`Listening on ${PORT}`))
httpServer.on("upgrade", SocketManager.httpServerUpgradeHandler)
