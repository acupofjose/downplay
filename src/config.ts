import { PrismaClient } from "@prisma/client"
import PubSub from "pubsub-js"
import { CONFIG_CHANGED } from "./events"

export type ConfigItems = {
  youtubeApiKey?: string
  jsonSigningSecret?: string
  concurrentWorkers: number
  shouldTranscodeAudio: boolean
  shouldPersistJson: boolean
  allowRegistration: boolean
  allowHeartbeat: boolean
  allowErrorReporting: boolean
}

const defaultConfig: ConfigItems = {
  concurrentWorkers: 3,
  shouldTranscodeAudio: true,
  shouldPersistJson: false,
  allowRegistration: true,
  allowHeartbeat: false,
  allowErrorReporting: false,
  jsonSigningSecret: process.env.JWT_SECRET,
  youtubeApiKey: process.env.YOUTUBE_API_KEY,
}

const prisma = new PrismaClient()
const CONFIG_KEY = "config"

class Config {
  values: ConfigItems = { ...defaultConfig }

  async refresh() {
    const result = await prisma.meta.findFirst({ where: { key: CONFIG_KEY } })
    if (result) {
      const json = JSON.parse(result.value) as ConfigItems
      this.values = { ...defaultConfig, ...json }
      return this.values
    } else {
      // Should only end up being called once.
      await this.persist()
      return this.values
    }
  }

  async persist() {
    await prisma.meta.upsert({
      create: { key: CONFIG_KEY, value: JSON.stringify(this.values) },
      update: { key: CONFIG_KEY, value: JSON.stringify(this.values) },
      where: { key: CONFIG_KEY },
    })
    PubSub.publish(CONFIG_CHANGED)
    return this.values
  }
}

export default new Config()
