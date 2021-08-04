import Api from "./index"
import { Channel as PrismaChannel } from "@prisma/client"

export default class Channel {
  static getAll = async (): Promise<PrismaChannel[]> => {
    const endpoint = `/channel`
    try {
      const result = await Api.instance.get<PrismaChannel[]>(endpoint)
      return result.data
    } catch (err) {
      console.log(err)
      return []
    }
  }

  static get = async (channelId: string) => {
    const endpoint = `/channel/${channelId}`
    try {
      const result = await Api.instance.get<PrismaChannel>(endpoint)
      return result
    } catch (err) {
      console.log(err)
      return null
    }
  }
}
