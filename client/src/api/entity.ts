import Api from "./index"
import { Entity as PrismaEntity } from ".prisma/client"

export default class Entity {
  static getAll = async (): Promise<PrismaEntity[]> => {
    const endpoint = `/entity`
    try {
      const result = await Api.instance.get<PrismaEntity[]>(endpoint)
      return result.data
    } catch (err) {
      console.log(err)
      return []
    }
  }

  static get = async (entityId: string) => {
    const endpoint = `/entity/${entityId}`
    try {
      const result = await Api.instance.get<PrismaEntity>(endpoint)
      return result
    } catch (err) {
      console.log(err)
      return null
    }
  }

  static delete = async (entityId: string) => {
    const endpoint = `/entity/delete/${entityId}`
    try {
      const result = await Api.instance.post(endpoint)
      return result.status
    } catch (err) {
      console.log(err)
      return null
    }
  }

  static getStreamingUrl = (entityId: string) => {
    const endpoint = `/entity/stream/${entityId}`
    return `${Api.host}${endpoint}`
  }

  static doesThumbnailExist = async (entityId: string) => {
    const url = Entity.getThumbnailUrl(entityId)
    const result = await Api.instance.head(url)
    return result.status === 200
  }

  static getThumbnailUrl = (entityId: string) => {
    const endpoint = `/entity/thumbnail/${entityId}`
    return `${Api.host}${endpoint}`
  }
}
