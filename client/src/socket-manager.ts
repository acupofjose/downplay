import { WEBSOCKET_HAS_OPENED, REFRESH_ENTITIES, WEBSOCKET_HAS_MESSAGE } from "./events"
import PubSub from "pubsub-js"
import Api from "./api"

class SocketManager {
  socket: WebSocket | null = null
  isConnecting: boolean = false
  endpoint?: string

  connect = (token: string) => {
    if (this.socket && this.isConnecting) return
    this.isConnecting = true

    //const origin = window.location.origin
    const origin = Api.host
    const url = origin.includes("https") ? origin.replace("https", "wss") : origin.replace("http", "ws")
    this.endpoint = `${url}?token=${token}`

    this.socket = new WebSocket(this.endpoint)

    this.socket.onopen = () => {
      this.isConnecting = false
      PubSub.publish(WEBSOCKET_HAS_OPENED)
      console.log(`Connection opened to: ${url}`)
    }

    this.socket.onmessage = (message) => {
      const json = JSON.parse(message.data)
      PubSub.publish(WEBSOCKET_HAS_MESSAGE, json)
    }

    this.socket.onclose = (ev) => {
      setTimeout(() => this.connect(token), 3000)
    }
  }

  close = () => this.socket?.close()
}

export default new SocketManager()
