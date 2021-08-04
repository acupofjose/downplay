import axios from "axios"
import Api from "./index"
import { Prisma, User as PrismaUser } from "@prisma/client"

export default class User {
  static get = async () => {
    const endpoint = "/user"
    const result = await Api.instance.get(endpoint)
    return result.data as PrismaUser
  }

  static set = async () => {}
}
