import React from "react"
import { Route, Switch, useHistory, withRouter } from "react-router-dom"

import { Provider as StyletronProvider } from "styletron-react"
import { Client as Styletron } from "styletron-engine-atomic"
import { DarkTheme, BaseProvider } from "baseui"

import { AUTH_LOGIN, AUTH_REGISTER, REFRESH_ENTITIES, WEBSOCKET_MESSAGE, WEBSOCKET_OPEN } from "./events"
import Navbar from "./components/Navbar"
import IndexPage from "./pages/IndexPage"
import AppContext, { IAppContext, LOCAL_STORAGE_KEY, DEFAULT_VALUE } from "./context/AppContext"
import PrivateRoute from "./components/PrivateRoute"
import LoginPage from "./pages/LoginPage"
import MusicPlayer from "./components/MusicPlayer"

const engine = new Styletron()

interface AppState {
  global: IAppContext
  isLoaded: boolean
}

class App extends React.Component<any, AppState> {
  socket: WebSocket | null = null

  constructor(props: any) {
    super(props)
    this.state = {
      global: this.getPersisted(),
      isLoaded: false,
    }
  }

  getPersisted = () => {
    try {
      return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) || "")
    } catch {
      return DEFAULT_VALUE
    }
  }

  setState(state: AppState) {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.global))
    super.setState(state)
  }

  componentDidMount() {
    console.log(this.state)

    PubSub.subscribe(AUTH_LOGIN, this.handleLoginOrRegisterEvent)
    PubSub.subscribe(AUTH_REGISTER, this.handleLoginOrRegisterEvent)

    if (this.state.global.token) {
      this.connect()
    }
  }

  componentWillUnmount() {
    PubSub.unsubscribe(this.handleLoginOrRegisterEvent)
    this.socket?.close()
  }

  handleLoginOrRegisterEvent = (e: string, token: string) => {
    this.setState({ ...this.state, global: { ...this.state.global, token } })
    this.props.history.push("/")
    this.connect()
  }

  connect = () => {
    if (this.socket && !this.socket.CLOSED) return

    //const origin = window.location.origin
    const origin = "http://localhost:3000"
    const url = origin.includes("https") ? origin.replace("https", "wss") : origin.replace("http", "ws")
    const endpoint = `${url}?token=${this.state.global.token}`

    this.socket = new WebSocket(endpoint)
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
      setTimeout(() => this.connect(), 3000)
    }
  }

  render() {
    return (
      <AppContext.Provider value={this.state.global}>
        <StyletronProvider value={engine}>
          <BaseProvider theme={DarkTheme}>
            <Navbar />
            <Switch>
              <Route path="/login" exact={true}>
                <LoginPage />
              </Route>
              <PrivateRoute>
                <IndexPage />
              </PrivateRoute>
            </Switch>
            {this.state.global?.token && <MusicPlayer />}
          </BaseProvider>
        </StyletronProvider>
      </AppContext.Provider>
    )
  }
}

export default withRouter(App)
