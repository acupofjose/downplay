import Api from "./index"
import { Feed as PrismaFeed } from "@prisma/client"

export default class Feed {
  static getAll = async (): Promise<PrismaFeed[]> => {
    const endpoint = `/feed`
    try {
      const result = await Api.instance.get<PrismaFeed[]>(endpoint)
      return result.data
    } catch (err) {
      console.log(err)
      return []
    }
  }

  static get = async (feedId: string) => {
    const endpoint = `/feed/${feedId}`
    try {
      const result = await Api.instance.get<PrismaFeed>(endpoint)
      return result
    } catch (err) {
      console.log(err)
      return null
    }
  }

  static xmlUrl = (feedId: string) => Api.host + `/feed/xml/${feedId}`

  static delete = async (feedId: string) => {
    const endpoint = `/feed/delete/${feedId}`
    try {
      const result = await Api.instance.post(endpoint)
      return result.status
    } catch (err) {
      console.log(err)
      return null
    }
  }
}
