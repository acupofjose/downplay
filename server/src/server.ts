import express from "express"
import SocketManager from "./socket-manager"
import apiRoutes from "./routes/api"

const PORT = process.env.PORT || 3000

const app = express()

app.use(apiRoutes)

const httpServer = app.listen(PORT, () => console.log(`Listening on ${PORT}`))
httpServer.on("upgrade", SocketManager.httpServerUpgradeHandler)
