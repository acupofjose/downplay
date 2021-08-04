import axios from "axios"
import Api from "./index"

export type ConfigItems = {
  youtubeApiKey?: string
  concurrentWorkers?: number
  shouldTranscodeAudio?: boolean
  shouldPersistJson?: boolean
  allowRegistration?: boolean
  allowHeartbeat?: boolean
  allowErrorReporting?: boolean
}

export default class Config {
  static get = async (token?: string) => {
    const endpoint = `/config`
    if (token) {
      const result = await axios.get(Api.host + endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return result.data as ConfigItems
    } else {
      const result = await Api.instance.get(endpoint)
      return result.data as ConfigItems
    }
  }

  static set = async (configItems: ConfigItems) => {
    const endpoint = `/config`
    const result = await Api.instance.post(endpoint, { values: { ...configItems } })
    return result.status === 200
  }

  static status = async () => {
    const endpoint = `/config/status`
    const result = await Api.instance.get(endpoint)
    return result.data as { initialized: boolean }
  }
}
