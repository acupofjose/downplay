import React from "react"
import ReactJkMusicPlayer, { ReactJkMusicPlayerAudioListProps, ReactJkMusicPlayerProps } from "react-jinke-music-player"
import "react-jinke-music-player/assets/index.css"
import { Entity, getEntities, getEntityStreamingUrl, getEntityThumbnailUrl } from "../api"
import { REFRESH_ENTITIES } from "../events"

const MusicPlayer = () => {
  const [entities, setEntities] = React.useState<Entity[]>([])
  const [options, setOptions] = React.useState<ReactJkMusicPlayerProps>({
    audioLists: [],
    theme: "auto",
    locale: "en_US",
    preload: false,
    remember: true,
    mode: "mini",
    drag: false,
    defaultPosition: { bottom: 5, left: 5 },
    quietUpdate: true,
  })

  const refresh = async () => {
    const result = await getEntities()
    setEntities(result?.data as Entity[])
  }

  React.useEffect(() => {
    const audioLists: ReactJkMusicPlayerAudioListProps[] = []

    for (const entity of entities) {
      audioLists.push({
        name: entity.title,
        musicSrc: getEntityStreamingUrl(entity.id),
        cover: getEntityThumbnailUrl(entity.id),
        singer: entity.channel,
      })
    }

    console.log(audioLists)

    setOptions({ ...options, audioLists })
  }, [entities])

  React.useEffect(() => {
    PubSub.subscribe(REFRESH_ENTITIES, refresh)
    refresh()
    return () => PubSub.unsubscribe(refresh)
  }, [])

  return <ReactJkMusicPlayer {...options} />
}

export default MusicPlayer
