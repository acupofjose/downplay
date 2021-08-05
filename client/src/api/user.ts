import axios from "axios"
import Api from "./index"
import { Prisma, User as PrismaUser } from "@prisma/client"

export default class User {
  static get = async () => {
    const endpoint = "/user"
    const result = await Api.instance.get(endpoint)
    return result.data as PrismaUser
  }

  static changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const endpoint = "/user/change-password"
      const result = await Api.instance.post(endpoint, { currentPassword, newPassword })
      return result.data as { status: boolean }
    } catch (err) {
      throw new Error(err.response.data.error)
    }
  }
}
