import axios from "axios"
import { IAppContext, LOCAL_STORAGE_KEY } from "./context/AppContext"

let hostname = ""
if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  hostname = `http://localhost:3000`
} else {
  hostname = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`
}

const getLocalStorageState = (key: string = LOCAL_STORAGE_KEY): IAppContext | null => {
  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    const json = JSON.parse(item)
    return json as IAppContext
  } catch (err) {
    return null
  }
}

const instance = () => {
  const context = getLocalStorageState()

  return axios.create({
    baseURL: hostname,
    headers: { Authorization: `Bearer ${context?.token}` },
  })
}

export interface Entity {
  id: number
  feedId?: any
  title: string
  description: string
  channel: string
  filename: string
  path: string
  originalUrl: string
  downloadUrl: string
  createdAt: Date
  queue: Queue
}

export interface Queue {
  id: number
  entityId: number
  isRunning: boolean
  hasErrored: boolean
  errorCount: number
  createdAt: Date
  completedAt: Date
}

export const login = async (username: string, password: string) => {
  const endpoint = `/auth/login`
  const result = await instance().post(endpoint, {
    username,
    password,
  })
  return result.data as { token: string }
}

export const register = async (username: string, password: string) => {
  const endpoint = `/auth/register`
  const result = await instance().post(endpoint, {
    username,
    password,
  })
  return result.data as { token: string }
}

export const enqueue = async (youtubeUrl: string, audioOnly: boolean = true) => {
  const endpoint = `/queue`
  try {
    const result = await instance().post(endpoint, {
      url: youtubeUrl,
      audioOnly,
    })
    return result
  } catch (err) {
    console.log(err)
  }
}

export const getQueue = () => {}

export const getEntities = async (): Promise<Entity[]> => {
  const endpoint = `/entities`
  try {
    const result = await instance().get<Entity[]>(endpoint)
    return result.data
  } catch (err) {
    console.log(err)
    return []
  }
}

export const getEntity = async (entityId: string) => {
  const endpoint = `/entities/${entityId}`
  try {
    const result = await instance().get<Entity>(endpoint)
    return result
  } catch (err) {
    console.log(err)
    return null
  }
}

export const getEntityStreamingUrl = (entityId: number) => {
  const endpoint = `/entities/stream/${entityId}`
  return `${hostname}${endpoint}`
}

export const getEntityThumbnailUrl = (entityId: number) => {
  const endpoint = `/entities/thumbnail/${entityId}`
  return `${hostname}${endpoint}`
}

export const deleteEntity = (entityId: string) => {}
