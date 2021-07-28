import axios from "axios"

const hostname = "http://localhost:3000"

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

export const download = async (youtubeUrl: string, audioOnly: boolean = true) => {
  const endpoint = `${hostname}/download/create`
  try {
    const result = await axios.post(endpoint, {
      url: youtubeUrl,
      audioOnly,
    })
    console.log(result)
    return result
  } catch (err) {
    console.log(err)
  }
}

export const getQueue = () => {}

export const getEntities = async () => {
  const endpoint = `${hostname}/entities`
  try {
    const result = await axios.get<Entity[]>(endpoint)
    console.log(result)
    return result
  } catch (err) {
    console.log(err)
  }
}
export const getEntity = async (entityId: string) => {
  const endpoint = `${hostname}/entities/${entityId}`
  try {
    const result = await axios.get<Entity>(endpoint)
    console.log(result)
    return result
  } catch (err) {
    console.log(err)
  }
}

export const deleteEntity = (entityId: string) => {}
