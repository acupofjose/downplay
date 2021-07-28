import axios from "axios"
import fs from "fs"
import path from "path"
import { parentPort } from "worker_threads"
import { EVENT_DOWNLOAD_COMPLETE, EVENT_DOWNLOAD_PROGRESS } from "./types"
import { PrismaClient, Queue, Entity } from "@prisma/client"

let isProcessing = false
const tickInterval = 5000
const prisma = new PrismaClient()

function download(entity: Entity, onProgress: (chunkLength: number, totalLength: number) => void): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const outDir = path.join(__dirname, "..", "storage", entity.channel)
    const outPath = path.join(outDir, entity.filename)

    if (!fs.existsSync(outDir)) {
      console.log(`Directory ${outDir} does not exist, creating...`)
      fs.mkdirSync(outDir)
    }

    const { data, headers } = await axios({
      url: entity.downloadUrl,
      method: "GET",
      responseType: "stream",
    })
    const totalLength = headers["content-length"]

    console.log(`Creating write stream to ${outPath}`)
    const writer = fs.createWriteStream(outPath)
    await prisma.entity.update({ where: { id: entity.id }, data: { path: outPath } })

    data.on("data", (chunk: any) => onProgress(chunk.length, totalLength))
    data.on("error", (err: any) => reject(err))
    data.on("close", () => resolve())
    data.pipe(writer)
  })
}

async function process(instance: Queue) {
  const entity = await prisma.entity.findFirst({ where: { id: instance?.entityId } })

  if (!entity) {
    parentPort?.postMessage(`Could not find entity of id ${instance.entityId}`)
    return
  }

  let progress = 0
  const onDownloadProgress = (chunk: number, total: number) => {
    progress += chunk

    const msg = {
      event: EVENT_DOWNLOAD_PROGRESS,
      entityId: instance?.entityId,
      progress: +((progress / total) * 100).toFixed(2),
    }

    parentPort?.postMessage(msg)
  }

  try {
    parentPort?.postMessage(`Attempting to download ${entity?.title}`)

    await prisma.queue.update({ where: { id: instance.id }, data: { isRunning: true } })
    await download(entity, onDownloadProgress)
    await prisma.queue.update({ where: { id: instance.id }, data: { completedAt: new Date() } })

    const msg = {
      event: EVENT_DOWNLOAD_COMPLETE,
      entityId: instance.entityId,
    }

    parentPort?.postMessage(msg)
    console.log(`Completed Queue[#${instance.id}]`)
  } catch (err) {
    console.error(err)
  }
}

async function tick() {
  if (isProcessing) return
  isProcessing = true

  const next = await prisma.queue.findFirst({ where: { completedAt: null }, orderBy: { createdAt: "desc" } })
  if (next) {
    await process(next)
  }

  isProcessing = false
}

function init() {
  console.log(`Registered Worker Loop.`)
  setInterval(tick, tickInterval)
}

init()
