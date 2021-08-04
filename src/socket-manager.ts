import WebSocket, * as ws from "ws"
import { v4 as uuidv4 } from "uuid"
import { getQueryJsonFromUrl } from "./util"
import jwt from "jsonwebtoken"
import Config from "./config"

class SocketManager {
  server: ws.Server
  sockets: { [key: string]: WebSocket | null } = {}
  users: { [key: string]: WebSocket[] } = {}

  constructor() {
    this.server = new ws.Server({ noServer: true })
    this.server.on("connection", this.onConnect)
  }

  static getIpFromRequest = (request: any) => {
    return request.headers["x-forwarded-for"] || request.connection.remoteAddress
  }

  httpServerUpgradeHandler = (request: any, socket: any, head: any) => {
    try {
      const { token } = getQueryJsonFromUrl(request.headers.origin + request.url)

      if (!token || !jwt.verify(token, Config.values.jsonSigningSecret!)) return

      const decoded = jwt.decode(token) as { user: { _id: string; username: string } }

      this.server.handleUpgrade(request, socket, head, (socket) => {
        console.log(`Socket Connection on ${SocketManager.getIpFromRequest(request)}`)

        this.server.emit("connection", socket, request, decoded.user)
      })
    } catch (err) {}
  }

  onConnect = (socket: WebSocket, request: any, user: { _id: string; username: string }) => {
    const uuid = uuidv4()
    this.sockets[uuid] = socket
    this.users[user._id] = [...this.users[user._id], socket]

    socket.on("message", (message) => this.onMessage(socket, message))
    socket.on("ping", (data) => socket.send(data))
    socket.on("close", () => (this.sockets[uuid] = null))
  }

  onMessage = (socket: WebSocket, message: WebSocket.Data) => {
    console.log(message)
  }

  broadcast = (message: string) => {
    const json = JSON.stringify(message) as any

    if (json.userId) {
      for (const socket of this.users[json.userId]) {
        socket?.send(json)
      }
    } else {
      for (const [uuid, socket] of Object.entries(this.sockets)) {
        socket?.send(json)
      }
    }
  }
}

export default new SocketManager()
