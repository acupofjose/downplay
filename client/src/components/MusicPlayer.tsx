import { Button } from "baseui/button"
import { ButtonGroup } from "baseui/button-group"
import React from "react"
import { getEntities, Entity, getEntityStreamingUrl, getEntityThumbnailUrl } from "../api"
import { PLAY_ENTITY, REFRESH_ENTITIES } from "../events"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBackward, faForward, faPlay, faPause } from "@fortawesome/free-solid-svg-icons"

import "./MusicPlayer.scss"

type MusicItem = {
  id: string
  name: string
  author: string
  img: string
  audio: string
  duration?: string
}

type MusicPlayerState = {
  entities: Entity[]
  index: number
  currentTime: string
  musicList: MusicItem[]
  pause: boolean
}

class MusicPlayer extends React.Component<any, MusicPlayerState> {
  playerRef: React.RefObject<HTMLAudioElement>
  timelineRef: React.RefObject<HTMLDivElement>
  playheadRef: React.RefObject<HTMLDivElement>
  hoverPlayheadRef: React.RefObject<HTMLDivElement>

  constructor(props: any) {
    super(props)
    this.playerRef = React.createRef<HTMLAudioElement>()
    this.timelineRef = React.createRef<HTMLDivElement>()
    this.playheadRef = React.createRef<HTMLDivElement>()
    this.hoverPlayheadRef = React.createRef<HTMLDivElement>()

    this.state = {
      index: 0,
      currentTime: "0:00",
      entities: [],
      musicList: [] as MusicItem[],
      pause: false,
    }
  }

  refresh = async () => {
    const result = await getEntities()
    this.setState({ ...this.state, entities: (result as Entity[]).filter((e) => e.queue?.createdAt !== null) })
  }

  componentDidMount() {
    PubSub.subscribe(REFRESH_ENTITIES, this.refresh)
    PubSub.subscribe(PLAY_ENTITY, this.playEntity)

    this.playerRef.current?.addEventListener("timeupdate", this.timeUpdate, false)
    this.playerRef.current?.addEventListener("ended", this.nextSong, false)
    this.timelineRef.current?.addEventListener("click", this.changeCurrentTime, false)
    this.timelineRef.current?.addEventListener("mousemove", this.hoverTimeLine, false)
    this.timelineRef.current?.addEventListener("mouseout", this.resetTimeLine, false)

    this.refresh()
  }

  componentWillUnmount() {
    PubSub.unsubscribe(this.refresh)

    this.playerRef.current?.removeEventListener("timeupdate", this.timeUpdate)
    this.playerRef.current?.removeEventListener("ended", this.nextSong)
    this.timelineRef.current?.removeEventListener("click", this.changeCurrentTime)
    this.timelineRef.current?.removeEventListener("mousemove", this.hoverTimeLine)
    this.timelineRef.current?.removeEventListener("mouseout", this.resetTimeLine)
  }

  componentDidUpdate(prevProps: any, prevState: MusicPlayerState) {
    if (prevState.entities != this.state.entities) {
      const musicList: MusicItem[] = []

      for (const entity of this.state.entities) {
        musicList.push({
          id: entity.id,
          name: entity.title,
          author: entity.channel,
          audio: getEntityStreamingUrl(entity.id),
          img: getEntityThumbnailUrl(entity.id),
        })
      }

      this.setState({ ...this.state, musicList })
    }
  }

  playEntity = (event: string, data: string) => {
    for (const [index, item] of this.state.musicList.entries()) {
      if (item.id === data) {
        this.setState({ ...this.state, index, pause: false })

        this.playerRef.current?.play()
        break
      }
    }
  }

  changeCurrentTime = (e: any) => {
    const duration = this.playerRef.current?.duration || 0

    const playheadWidth = this.timelineRef.current!.offsetWidth
    const offsetWidth = this.timelineRef.current!.offsetLeft

    const userClickWidht = e.clientX - offsetWidth

    const userClickWidhtInPercent = (userClickWidht * 100) / playheadWidth

    this.playheadRef.current!.style.width = userClickWidhtInPercent + "%"
    this.playerRef.current!.currentTime = (duration * userClickWidhtInPercent) / 100
  }

  hoverTimeLine = (e: any) => {
    const duration = this.playerRef.current!.duration

    const playheadWidth = this.timelineRef.current!.offsetWidth

    const offsetWidht = this.timelineRef.current!.offsetLeft
    const userClickWidht = e.clientX - offsetWidht
    const userClickWidhtInPercent = (userClickWidht * 100) / playheadWidth

    if (userClickWidhtInPercent <= 100) {
      this.hoverPlayheadRef.current!.style.width = userClickWidhtInPercent + "%"
    }

    const time = (duration * userClickWidhtInPercent) / 100

    if (time >= 0 && time <= duration) {
      this.hoverPlayheadRef.current!.dataset.content = this.formatTime(time)
    }
  }

  resetTimeLine = () => {
    this.hoverPlayheadRef.current!.style.width = "0"
  }

  timeUpdate = () => {
    const duration = this.playerRef.current!.duration
    const timelineWidth = this.timelineRef.current!.offsetWidth - this.playheadRef.current!.offsetWidth
    const playPercent = 100 * (this.playerRef.current!.currentTime / duration)
    this.playheadRef.current!.style.width = playPercent + "%"
    const currentTime = this.formatTime(this.playerRef.current!.currentTime)
    this.setState({
      currentTime,
    })
  }

  formatTime = (currentTime: number) => {
    if (!currentTime) return "0:00"

    const minutes = Math.floor(currentTime / 60)
    let seconds: number | string = Math.floor(currentTime % 60)

    seconds = seconds >= 10 ? seconds : "0" + (seconds % 60)

    const formatTime = minutes + ":" + seconds

    return formatTime
  }

  updatePlayer = () => {
    const { musicList, index } = this.state
    const currentSong = musicList[index]
    this.playerRef.current!.load()
  }

  nextSong = () => {
    const { musicList, index, pause } = this.state

    this.setState({
      index: (index + 1) % musicList.length,
    })
    this.updatePlayer()
    if (pause) {
      this.playerRef.current!.play()
    }
  }

  prevSong = () => {
    const { musicList, index, pause } = this.state

    this.setState({
      index: (index + musicList.length - 1) % musicList.length,
    })
    this.updatePlayer()
    if (pause) {
      this.playerRef.current!.play()
    }
  }

  playOrPause = () => {
    const { musicList, index, pause } = this.state
    const currentSong = musicList[index]
    if (!this.state.pause) {
      this.playerRef.current!.play()
    } else {
      this.playerRef.current!.pause()
    }
    this.setState({
      pause: !pause,
    })
  }

  clickAudio = (key: any) => {
    const { pause } = this.state

    this.setState({
      index: key,
    })

    this.updatePlayer()
    if (pause) {
      this.playerRef.current!.play()
    }
  }

  render() {
    const { musicList, index, currentTime, pause } = this.state
    const currentSong = musicList.length > index ? musicList[index] : { audio: "", name: "", img: "", author: "" }

    return (
      <div className="MusicPlayer">
        <div className="wrapper">
          <div className="current-song">
            <audio ref={this.playerRef}>
              {currentSong && <source src={currentSong.audio} type="audio/ogg" />}
              Your browser does not support the audio element.
            </audio>

            <div className="song-img" style={{ backgroundImage: `url(${currentSong.img})` }} />
            <div className="track-info">
              <span className="song-name">{currentSong.name}</span>
              <span className="song-author">{currentSong.author}</span>
            </div>

            <div className="track-meta">
              <div ref={this.timelineRef} id="timeline">
                <div ref={this.playheadRef} id="playhead"></div>
                <div ref={this.hoverPlayheadRef} className="hover-playhead" data-content="0:00"></div>
                <div className="track-time">
                  <div className="current-time">{currentTime}</div>
                  <div className="end-time">{this.formatTime(this.playerRef.current?.duration || 0)}</div>
                </div>
              </div>
            </div>

            <div className="controls">
              <ButtonGroup>
                <Button onClick={this.prevSong}>
                  <FontAwesomeIcon icon={faBackward}></FontAwesomeIcon>
                </Button>

                <Button onClick={this.playOrPause}>
                  {!pause ? (
                    <FontAwesomeIcon icon={faPlay}></FontAwesomeIcon>
                  ) : (
                    <FontAwesomeIcon icon={faPause}></FontAwesomeIcon>
                  )}
                </Button>
                <Button onClick={this.nextSong}>
                  <FontAwesomeIcon icon={faForward}></FontAwesomeIcon>
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default MusicPlayer
