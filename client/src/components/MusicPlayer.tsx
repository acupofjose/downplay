import React from "react"
import ReactJkMusicPlayer, {
  ReactJkMusicPlayerAudioListProps,
  ReactJkMusicPlayerInstance,
  ReactJkMusicPlayerProps,
} from "react-jinke-music-player"
import "react-jinke-music-player/assets/index.css"
import { Entity, getEntities, getEntityStreamingUrl, getEntityThumbnailUrl } from "../api"
import { REFRESH_ENTITIES } from "../events"

type MusicPlayerState = {
  entities: Entity[]
  options: ReactJkMusicPlayerProps
}

class MusicPlayer extends React.Component<any, MusicPlayerState> {
  player: ReactJkMusicPlayerInstance | null = null

  constructor(props: any) {
    super(props)
    this.state = {
      entities: [],
      options: {
        audioLists: [],
        getAudioInstance: (instance) => (this.player = instance),
        theme: "auto",
        locale: "en_US",
        autoPlay: false,
        preload: false,
        mode: "mini",
        drag: false,
        quietUpdate: true,
        volumeFade: { fadeIn: 500, fadeOut: 500 },
        showThemeSwitch: false,
        showLyric: false,
        defaultPosition: { bottom: 15, left: 15 },
      },
    }
  }

  refresh = async () => {
    const result = await getEntities()
    this.setState({ ...this.state, entities: (result as Entity[]).filter((e) => e.queue?.createdAt !== null) })
  }

  componentDidMount() {
    PubSub.subscribe(REFRESH_ENTITIES, this.refresh)
    this.refresh()
  }

  componentWillUnmount() {
    PubSub.unsubscribe(this.refresh)
  }

  componentDidUpdate(prevProps: any, prevState: MusicPlayerState) {
    if (prevState.entities != this.state.entities) {
      const audioLists: ReactJkMusicPlayerAudioListProps[] = []

      for (const entity of this.state.entities) {
        audioLists.push({
          name: entity.title,
          musicSrc: getEntityStreamingUrl(entity.id),
          cover: getEntityThumbnailUrl(entity.id),
          singer: entity.channel,
        })
      }

      this.setState({ ...this.state, options: { ...this.state.options, audioLists } })
    }
  }

  render() {
    return <ReactJkMusicPlayer {...this.state.options} />
  }
}

export default MusicPlayer
