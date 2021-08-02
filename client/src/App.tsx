import React from "react"
import { Route, Switch, withRouter } from "react-router-dom"

import { Provider as StyletronProvider } from "styletron-react"
import { Client as Styletron } from "styletron-engine-atomic"
import { DarkTheme, BaseProvider } from "baseui"

import SocketManager from "./socket-manager"
import { getEntities } from "./api"
import { AUTH_LOGIN, AUTH_REGISTER, REFRESH_ENTITIES } from "./events"
import AppContext, { IAppContext, LOCAL_STORAGE_KEY, DEFAULT_VALUE } from "./context/AppContext"

import LoginPage from "./pages/LoginPage"
import FeedPage from "./pages/FeedPage"
import SettingsPage from "./pages/SettingsPage"

import Navbar from "./components/Navbar"
import IndexPage from "./pages/IndexPage"
import PrivateRoute from "./components/PrivateRoute"

const engine = new Styletron()

interface AppState {
  global: IAppContext
  isLoaded: boolean
}

class App extends React.Component<any, AppState> {
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
    PubSub.subscribe(AUTH_LOGIN, this.handleLoginOrRegisterEvent)
    PubSub.subscribe(AUTH_REGISTER, this.handleLoginOrRegisterEvent)
    PubSub.subscribe(REFRESH_ENTITIES, this.refreshEntities)

    if (this.state.global.token) {
      SocketManager.connect(this.state.global.token)
      this.refreshEntities()
    }
  }

  componentWillUnmount() {
    PubSub.unsubscribe(this.handleLoginOrRegisterEvent)
    PubSub.unsubscribe(this.refreshEntities)
    SocketManager?.close()
  }

  handleLoginOrRegisterEvent = (e: string, token: string) => {
    this.setState({ ...this.state, global: { ...this.state.global, token } })
    this.props.history.push("/")
    SocketManager.connect(token)
  }

  refreshEntities = async () => {
    const entities = await getEntities()
    if (entities) {
      this.setState({ ...this.state, global: { ...this.state.global, entities: entities } })
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
              <PrivateRoute path="/feeds" exact={true}>
                <FeedPage />
              </PrivateRoute>
              <PrivateRoute path="/settings" exact={true}>
                <SettingsPage />
              </PrivateRoute>
              <PrivateRoute path="/">
                <IndexPage />
              </PrivateRoute>
            </Switch>
          </BaseProvider>
        </StyletronProvider>
      </AppContext.Provider>
    )
  }
}

export default withRouter(App)
