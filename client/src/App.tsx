import React from "react"
import { Route, Switch, withRouter } from "react-router-dom"

import { Provider as StyletronProvider } from "styletron-react"
import { Client as Styletron } from "styletron-engine-atomic"
import { DarkTheme, BaseProvider } from "baseui"
import { Spinner } from "baseui/spinner"

import Feed from "./api/feed"
import Entity from "./api/entity"
import SocketManager from "./socket-manager"
import {
  AUTH_LOGIN,
  AUTH_REGISTER,
  ONBOARDING_AUTH,
  ONBOARDING_COMPLETE,
  PLAY_ENTITY,
  REFRESH_ALL,
  REFRESH_ENTITIES,
  REFRESH_FEEDS,
  WEBSOCKET_OPEN,
} from "./events"
import AppContext, { IAppContext, LOCAL_STORAGE_KEY, DEFAULT_VALUE } from "./context/AppContext"

import LoginPage from "./pages/LoginPage"
import FeedPage from "./pages/FeedPage"
import SettingsPage from "./pages/SettingsPage"

import Navbar from "./components/Navbar"
import IndexPage from "./pages/IndexPage"
import PrivateRoute from "./components/PrivateRoute"

import PlayAudioModal, { PlayAudioModalProps } from "./components/PlayAudioModal"
import OnboardingPage from "./pages/OnboardingPage"
import Config from "./api/config"
import { Block } from "baseui/block"

const engine = new Styletron()

interface AppState {
  global: IAppContext
  isLoading: boolean
  isInitialized: boolean
  showPlayAudioModal: boolean
  playAudioModalProps?: PlayAudioModalProps
}

class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props)
    this.state = {
      global: this.getPersisted(),
      isLoading: true,
      isInitialized: false,
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
    this.init()

    PubSub.subscribe(AUTH_LOGIN, this.handleLoginOrRegisterEvent)
    PubSub.subscribe(AUTH_REGISTER, this.handleLoginOrRegisterEvent)
    PubSub.subscribe(ONBOARDING_AUTH, this.handleOnboardingAuth)
    PubSub.subscribe(ONBOARDING_COMPLETE, this.init)
    PubSub.subscribe(PLAY_ENTITY, this.playEntity)
    PubSub.subscribe(REFRESH_ALL, this.refreshAll)
    PubSub.subscribe(REFRESH_ENTITIES, this.refreshEntities)
    PubSub.subscribe(REFRESH_FEEDS, this.refreshFeeds)
    PubSub.subscribe(WEBSOCKET_OPEN, this.refreshAll)
  }

  componentWillUnmount() {
    PubSub.unsubscribe(this.handleLoginOrRegisterEvent)
    PubSub.unsubscribe(this.handleOnboardingAuth)
    PubSub.unsubscribe(this.refreshAll)
    PubSub.unsubscribe(this.refreshEntities)
    PubSub.unsubscribe(this.refreshFeeds)
    PubSub.unsubscribe(this.playEntity)
    PubSub.unsubscribe(this.init)

    SocketManager?.close()
  }

  init = async () => {
    this.setState({ ...this.state, isLoading: true })

    const { initialized: isInitialized } = await Config.status()

    if (this.state.global.token) {
      SocketManager.connect(this.state.global.token)
    }

    this.setState({ ...this.state, isInitialized, isLoading: false })
  }

  handleLoginOrRegisterEvent = (e: string, token: string) => {
    this.setState({ ...this.state, global: { ...this.state.global, token } })
    this.props.history.push("/")
    SocketManager.connect(token)
  }

  handleOnboardingAuth = (e: string, token: string) => {
    this.setState({ ...this.state, global: { ...this.state.global, token } })
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
            {this.state.isLoading && (
              <Block
                position="fixed"
                top="50%"
                left="50%"
                maxWidth="5rem"
                maxHeight="5rem"
                $style={{ zIndex: 50, transform: "translate(-50%, -50%)" }}>
                <Spinner />
              </Block>
            )}
            {!this.state.isLoading && !this.state.isInitialized && <OnboardingPage />}
            {!this.state.isLoading && this.state.isInitialized && (
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
            )}
            {!!this.state.playAudioModalProps && <PlayAudioModal {...this.state.playAudioModalProps} />}
          </BaseProvider>
        </StyletronProvider>
      </AppContext.Provider>
    )
  }
}

export default withRouter(App)
