import { google } from "googleapis"
import Config from "../config"

const api = google.youtube({
  version: "v3",
  auth: Config.YoutubeApiKey,
})

export default class YoutubeAPI {
  static getVideosForChannel = async (forUsername: string) => {
    const results = await api.channels.list({
      part: ["id"],
      forUsername,
    })

    if (!results.data.items) throw new Error(`Unable to find channel with username ${forUsername}`)

    const channelId = results.data.items[0].id

    if (!channelId) throw new Error(`Unable to find channel with username ${forUsername}`)

    const videos = await api.search.list({
      part: ["snippet"],
      channelId,
      order: "date",
      maxResults: 20,
    })

    if (!videos.data.items) throw new Error(`Unable to find videos for channel with id ${channelId}`)

    for (const { id, snippet } of videos.data.items) {
      console.log(id, snippet)
    }
  }
}
