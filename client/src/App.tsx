import React from "react"
import { Route, Switch, useHistory } from "react-router-dom"

import { Provider as StyletronProvider } from "styletron-react"
import { Client as Styletron } from "styletron-engine-atomic"
import { DarkTheme, BaseProvider } from "baseui"

import { AUTH_LOGIN, AUTH_REGISTER, REFRESH_ENTITIES, WEBSOCKET_MESSAGE, WEBSOCKET_OPEN } from "./events"
import Navbar from "./components/Navbar"
import IndexPage from "./pages/IndexPage"
import AppContext, { IAppContext, LOCAL_STORAGE_KEY } from "./context/AppContext"
import PrivateRoute from "./components/PrivateRoute"
import LoginPage from "./pages/LoginPage"
import { useLocalStorage } from "./hooks/useLocalStorage"
import MusicPlayer from "./components/MusicPlayer"

const engine = new Styletron()

function App() {
  let socket: WebSocket | null = null

  const history = useHistory()
  const [state, setState] = useLocalStorage<IAppContext>(LOCAL_STORAGE_KEY, {
    token: "",
  })

  const handleLoginOrRegisterEvent = (e: string, token: string) => {
    setState({ ...state, token })
    console.log(history)
    history.push("/")
  }

  const connect = () => {
    if (socket) return

    //const origin = window.location.origin
    const origin = "http://localhost:3000"
    const url = origin.includes("https") ? origin.replace("https", "wss") : origin.replace("http", "ws")
    socket = new WebSocket(url)
    socket.onopen = () => {
      PubSub.publish(WEBSOCKET_OPEN)
      PubSub.publish(REFRESH_ENTITIES)
      console.log(`Connection opened to: ${url}`)
    }

    socket.onmessage = (message) => {
      const json = JSON.parse(message.data)
      PubSub.publish(WEBSOCKET_MESSAGE, json)
    }

    socket.onerror = (err) => console.error(err)
    socket.onclose = (ev) => {
      console.log(`Connection closed, attempting to reconnection.`)
      setTimeout(connect, 3000)
    }
  }

  React.useEffect(() => {
    console.log("Mounted")
    connect()
    PubSub.subscribe(AUTH_LOGIN, handleLoginOrRegisterEvent)
    PubSub.subscribe(AUTH_REGISTER, handleLoginOrRegisterEvent)
    return () => {
      PubSub.unsubscribe(handleLoginOrRegisterEvent)
      socket?.close()
    }
  }, [])

  return (
    <AppContext.Provider value={state}>
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
          {state.token && <MusicPlayer />}
        </BaseProvider>
      </StyletronProvider>
    </AppContext.Provider>
  )
}

export default App
