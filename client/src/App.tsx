import React from "react"
import { Route, Switch, withRouter } from "react-router-dom"

import { Provider as StyletronProvider } from "styletron-react"
import { Client as Styletron } from "styletron-engine-atomic"
import { DarkTheme, BaseProvider } from "baseui"

import { Entity as PrismaEntity } from "@prisma/client"
import Feed from "./api/feed"
import Entity from "./api/entity"
import SocketManager from "./socket-manager"
import { AUTH_LOGIN, AUTH_REGISTER, PLAY_ENTITY, REFRESH_ALL, REFRESH_ENTITIES, REFRESH_FEEDS } from "./events"
import AppContext, { IAppContext, LOCAL_STORAGE_KEY, DEFAULT_VALUE } from "./context/AppContext"

import LoginPage from "./pages/LoginPage"
import FeedPage from "./pages/FeedPage"
import SettingsPage from "./pages/SettingsPage"

import Navbar from "./components/Navbar"
import IndexPage from "./pages/IndexPage"
import PrivateRoute from "./components/PrivateRoute"

import PlayAudioModal, { PlayAudioModalProps } from "./components/PlayAudioModal"

const engine = new Styletron()

interface AppState {
  global: IAppContext
  isLoaded: boolean
  showPlayAudioModal: boolean
  playAudioModalProps?: PlayAudioModalProps
}

class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props)
    this.state = {
      global: this.getPersisted(),
      isLoaded: false,
      showPlayAudioModal: false,
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
    PubSub.subscribe(REFRESH_ALL, this.refreshAll)
    PubSub.subscribe(REFRESH_ENTITIES, this.refreshEntities)
    PubSub.subscribe(REFRESH_FEEDS, this.refreshFeeds)
    PubSub.subscribe(PLAY_ENTITY, this.playEntity)

    if (this.state.global.token) {
      SocketManager.connect(this.state.global.token)
      this.refreshAll()
    }
  }

  componentWillUnmount() {
    PubSub.unsubscribe(this.handleLoginOrRegisterEvent)
    PubSub.unsubscribe(this.refreshAll)
    PubSub.unsubscribe(this.refreshEntities)
    PubSub.unsubscribe(this.refreshFeeds)
    PubSub.unsubscribe(this.playEntity)

    SocketManager?.close()
  }

  handleLoginOrRegisterEvent = (e: string, token: string) => {
    this.setState({ ...this.state, global: { ...this.state.global, token } })
    this.props.history.push("/")
    SocketManager.connect(token)
  }

  refreshAll = async () => {
    await this.refreshEntities()
    await this.refreshFeeds()
  }

  refreshEntities = async () => {
    const entities = await Entity.getAll()
    if (entities) {
      this.setState({ ...this.state, global: { ...this.state.global, entities } })
    }
  }

  refreshFeeds = async () => {
    const feeds = await Feed.getAll()
    if (feeds) {
      this.setState({ ...this.state, global: { ...this.state.global, feeds } })
    }
  }

  playEntity = (event: string, entityId: string) => {
    const entity = this.state.global.entities.find((e) => e.id === entityId)

    if (entity) {
      this.setState({
        ...this.state,
        playAudioModalProps: {
          onClose: () =>
            this.setState({
              ...this.state,
              playAudioModalProps: undefined,
            }),
          entity,
          isOpen: true,
        },
      })
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
            {!!this.state.playAudioModalProps && <PlayAudioModal {...this.state.playAudioModalProps} />}
          </BaseProvider>
        </StyletronProvider>
      </AppContext.Provider>
    )
  }
}

export default withRouter(App)
