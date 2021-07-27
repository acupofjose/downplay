import React, { useState } from "react"
import { Provider as StyletronProvider } from "styletron-react"
import { Client as Styletron } from "styletron-engine-atomic"
import { DarkTheme, BaseProvider, styled } from "baseui"
import { StatefulInput } from "baseui/input"
import Navbar from "./components/Navbar"

const engine = new Styletron()

const Centered = styled("div", {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
})

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
    this.socket.onopen = () => console.log(`Connection opened to: ${url}`)
    this.socket.onmessage = (message) => console.log(message)
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
          <Centered>
            <StatefulInput placeholder={"Youtube URL"} />
          </Centered>
        </BaseProvider>
      </StyletronProvider>
    )
  }
}

export default App
