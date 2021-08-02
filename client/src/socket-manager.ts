import { WEBSOCKET_OPEN, REFRESH_ENTITIES, WEBSOCKET_MESSAGE } from "./events"
import PubSub from "pubsub-js"
import Api from "./api"

class SocketManager {
  socket: WebSocket | null = null
  endpoint?: string

  connect = (token: string) => {
    if (this.socket && !this.socket.CLOSED) return

    //const origin = window.location.origin
    const origin = Api.host
    const url = origin.includes("https") ? origin.replace("https", "wss") : origin.replace("http", "ws")
    this.endpoint = `${url}?token=${token}`

    this.socket = new WebSocket(this.endpoint)
    this.socket.onopen = () => {
      PubSub.publish(WEBSOCKET_OPEN)
      PubSub.publish(REFRESH_ENTITIES)
      console.log(`Connection opened to: ${url}`)
    }

    this.socket.onmessage = (message) => {
      const json = JSON.parse(message.data)
      PubSub.publish(WEBSOCKET_MESSAGE, json)
    }

    this.socket.onerror = (err) => console.error(err)
    this.socket.onclose = (ev) => {
      console.log(`Connection closed, attempting to reconnection.`)
      setTimeout(() => this.connect(token), 3000)
    }
  }

  close = () => this.socket?.close()
}

export default new SocketManager()
