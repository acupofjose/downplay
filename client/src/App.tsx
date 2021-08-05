import React from "react"
import { Route, Switch, withRouter } from "react-router-dom"

import { Provider as StyletronProvider } from "styletron-react"
import { Client as Styletron } from "styletron-engine-atomic"
import { DarkTheme, BaseProvider } from "baseui"
import { Spinner } from "baseui/spinner"
import { Block } from "baseui/block"

import Feed from "./api/feed"
import Entity from "./api/entity"
import Api from "./api"
import User from "./api/user"
import Channel from "./api/channel"
import Config, { ConfigStatus } from "./api/config"

import SocketManager from "./socket-manager"
import {
  USER_HAS_LOGGED_IN,
  USER_HAS_REGISTERED,
  ONBOARDING_HAS_AUTHED,
  ONBOARDING_IS_COMPLETE,
  PLAY_REQUESTED_ENTITY,
  REFRESH_ALL,
  REFRESH_ENTITIES,
  REFRESH_FEEDS,
  WEBSOCKET_HAS_OPENED,
  USER_IS_LOGGING_OUT,
  CONFIG_HAS_CHANGED,
} from "./events"
import AppContext, { IAppContext, LOCAL_STORAGE_KEY, DEFAULT_VALUE, getPersistedContext } from "./context/AppContext"

import LoginPage from "./pages/LoginPage"
import FeedPage from "./pages/FeedPage"
import SettingsPage from "./pages/SettingsPage"
import OnboardingPage from "./pages/OnboardingPage"

import Navbar from "./components/Navbar"
import IndexPage from "./pages/IndexPage"
import PrivateRoute from "./components/PrivateRoute"
import PlayAudioModal, { PlayAudioModalProps } from "./components/PlayAudioModal"
import { Analytics } from "./analytics"

const engine = new Styletron()

interface AppState {
  global: IAppContext
  isLoading: boolean
  showPlayAudioModal: boolean
  playAudioModalProps?: PlayAudioModalProps
}

/**
 * Entry point for Downplay
 *
 * At its core, we need to know that the `App.state.global` is the AppContext
 * updated for child components to use. Using this format, child components
 * has the ability to access (reliably) global state, saving on external API calls.
 *
 * Secondly, we really leverage the PubSub library to handle decupled events
 * rather than doing explicit component coupling.
 *
 * So, AppContext is used to give `access` to global state, PubSub is used to
 * `affect` global state.
 */
class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props)
    this.state = {
      global: getPersistedContext(),
      isLoading: true,
      showPlayAudioModal: false,
    }
  }

  setState(state: AppState) {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.global))
    super.setState(state)
  }

  componentDidMount() {
    this.init()

    // Subscribe to global events and affect state accordingly
    PubSub.subscribe(USER_HAS_LOGGED_IN, this.handleLoginOrRegisterEvent)
    PubSub.subscribe(USER_HAS_REGISTERED, this.handleLoginOrRegisterEvent)
    PubSub.subscribe(USER_IS_LOGGING_OUT, this.handleLogout)

    PubSub.subscribe(CONFIG_HAS_CHANGED, this.refreshStatus)

    PubSub.subscribe(ONBOARDING_HAS_AUTHED, this.handleOnboardingAuth)
    PubSub.subscribe(ONBOARDING_IS_COMPLETE, this.init)

    PubSub.subscribe(PLAY_REQUESTED_ENTITY, this.playEntity)

    PubSub.subscribe(REFRESH_ALL, this.refreshAll)
    PubSub.subscribe(REFRESH_ENTITIES, this.refreshEntities)
    PubSub.subscribe(REFRESH_FEEDS, this.refreshFeeds)

    PubSub.subscribe(WEBSOCKET_HAS_OPENED, this.refreshAll)
  }

  componentWillUnmount() {
    PubSub.unsubscribe(this.handleLoginOrRegisterEvent)
    PubSub.unsubscribe(this.handleOnboardingAuth)
    PubSub.unsubscribe(this.handleLogout)

    PubSub.unsubscribe(this.refreshAll)
    PubSub.unsubscribe(this.refreshEntities)
    PubSub.unsubscribe(this.refreshFeeds)

    PubSub.unsubscribe(this.playEntity)

    PubSub.unsubscribe(this.init)

    SocketManager?.close()
  }

  init = async () => {
    this.setState({ ...this.state, isLoading: true })

    let status: ConfigStatus

    try {
      // Attempt to get server status, if this fails the backend server is not up.
      status = await Config.status()
    } catch (err) {
      // Server is not up, make a loop to recheck
      setTimeout(() => this.init(), 2000)
      return
    }

    // Only register Sentry.io if enabled in settings
    Analytics.initIfEnabled(status)

    // User is logged in
    if (this.state.global.token) {
      const isValidToken = await Api.checkTokenIsValid()

      // Invalidate global state
      if (!isValidToken) {
        this.setState({ ...this.state, global: { ...DEFAULT_VALUE, status }, isLoading: false })
        return
      }

      SocketManager.connect(this.state.global.token)
    }

    this.setState({ ...this.state, global: { ...this.state.global, status }, isLoading: false })
  }

  // If user logs in, redirect to the main page.
  handleLoginOrRegisterEvent = (e: string, token: string) => {
    this.setState({ ...this.state, global: { ...this.state.global, token } })
    this.props.history.push("/")
    SocketManager.connect(token)
  }

  handleLogout = () => {
    SocketManager.close()
    this.setState({ ...this.state, global: { ...DEFAULT_VALUE, status: { ...this.state.global.status } } })
    this.props.history.push("/login")
  }

  // After onboarding, set token, but do not redirect
  handleOnboardingAuth = (e: string, token: string) => {
    this.setState({ ...this.state, global: { ...this.state.global, token } })
  }

  refreshAll = async () => {
    await this.refreshUser()
    await this.refreshEntities()
    await this.refreshFeeds()
    await this.refreshChannels()
  }

  refreshStatus = async () => {
    const status = await Config.status()
    if (status) {
      this.setState({ ...this.state, global: { ...this.state.global, status } })
    }
  }

  refreshUser = async () => {
    const user = await User.get()
    if (user) {
      this.setState({ ...this.state, global: { ...this.state.global, user } })
    }
  }

  refreshChannels = async () => {
    const channels = await Channel.getAll()
    if (channels) {
      this.setState({ ...this.state, global: { ...this.state.global, channels } })
    }
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
            {!this.state.isLoading && !this.state.global.status.initialized && <OnboardingPage />}
            {!this.state.isLoading && this.state.global.status.initialized && (
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
