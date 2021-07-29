import React, { useState } from "react"
import { Provider as StyletronProvider } from "styletron-react"
import { Client as Styletron } from "styletron-engine-atomic"
import { DarkTheme, BaseProvider, styled } from "baseui"
import Navbar from "./components/Navbar"
import RequestForm from "./components/RequestForm"
import EntitiesList from "./components/EntitiesList"
import { WEBSOCKET_MESSAGE, WEBSOCKET_OPEN } from "./events"

const engine = new Styletron()

class App extends React.Component {
  socket: WebSocket | null = null
  constructor(props: any) {
    super(props)
  }

  componentDidMount() {
    this.connect()
  }

  connect = () => {
    //const origin = window.location.origin
    const origin = "http://localhost:3000"
    const url = origin.includes("https") ? origin.replace("https", "wss") : origin.replace("http", "ws")
    this.socket = new WebSocket(url)
    this.socket.onopen = () => {
      PubSub.publish(WEBSOCKET_OPEN)
      console.log(`Connection opened to: ${url}`)
    }

    this.socket.onmessage = (message) => {
      const json = JSON.parse(message.data)
      PubSub.publish(WEBSOCKET_MESSAGE, json)
    }

    this.socket.onerror = (err) => console.error(err)
    this.socket.onclose = (ev) => {
      console.log(`Connection closed, attempting to reconnection.`)
      setTimeout(this.connect, 3000)
    }
  }

  render() {
    return (
      <StyletronProvider value={engine}>
        <BaseProvider theme={DarkTheme}>
          <Navbar />
          <RequestForm />
          <EntitiesList />
        </BaseProvider>
      </StyletronProvider>
    )
  }
}

export default App
