import axios from "axios"
import { IAppContext, LOCAL_STORAGE_KEY } from "../context/AppContext"

export default class Api {
  static get instance() {
    const context = Api.getLocalStorageState()

    return axios.create({
      baseURL: Api.host,
      headers: { Authorization: `Bearer ${context?.token}` },
    })
  }

  static checkTokenIsValid = async () => {
    const context = Api.getLocalStorageState()

    try {
      const result = await axios.head(`${Api.host}/user`, {
        headers: {
          Authorization: `Bearer ${context?.token}`,
        },
      })
      return result.status === 200
    } catch (err) {
      return false
    }
  }

  static getLocalStorageState = (key: string = LOCAL_STORAGE_KEY): IAppContext | null => {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null

      const json = JSON.parse(item)
      return json as IAppContext
    } catch (err) {
      return null
    }
  }

  static get host() {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
      return `http://localhost:3000`
    } else {
      return `${window.location.protocol}//${window.location.host}`
    }
  }
}
