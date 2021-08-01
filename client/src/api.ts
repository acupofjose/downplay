import { Entity as PrismaEntity, Queue as PrismaQueue } from "@prisma/client"
import axios from "axios"
import { IAppContext, LOCAL_STORAGE_KEY } from "./context/AppContext"

export interface Entity extends PrismaEntity {
  queue: Queue
}
export interface Queue extends PrismaQueue {
  entity: Entity
}

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
  const endpoint = `/entity`
  try {
    const result = await instance().get<Entity[]>(endpoint)
    return result.data
  } catch (err) {
    console.log(err)
    return []
  }
}

export const getEntity = async (entityId: string) => {
  const endpoint = `/entity/${entityId}`
  try {
    const result = await instance().get<Entity>(endpoint)
    return result
  } catch (err) {
    console.log(err)
    return null
  }
}

export const deleteEntity = async (entityId: string) => {
  const endpoint = `/entity/delete/${entityId}`
  try {
    const result = await instance().post(endpoint)
    return result.status
  } catch (err) {
    console.log(err)
    return null
  }
}

export const getEntityStreamingUrl = (entityId: string) => {
  const endpoint = `/entity/stream/${entityId}`
  return `${hostname}${endpoint}`
}

export const doesEntityThumbnailExist = async (entityId: string) => {
  const url = getEntityThumbnailUrl(entityId)
  const result = await instance().head(url)
  return result.status === 200
}

export const getEntityThumbnailUrl = (entityId: string) => {
  const endpoint = `/entity/thumbnail/${entityId}`
  return `${hostname}${endpoint}`
}
