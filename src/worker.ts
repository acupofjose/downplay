import axios from "axios"
import fs from "fs"
import path from "path"
import { parentPort, workerData } from "worker_threads"

import { PrismaClient, Queue, Entity } from "@prisma/client"
import { STORAGE_PATH } from "./constants"

import {
  EVENT_DOWNLOAD_COMPLETE,
  EVENT_DOWNLOAD_ERROR,
  EVENT_DOWNLOAD_PROGRESS,
  Format,
  YoutubedlResult,
} from "./types"

// Flag for put a lock on the tick function
let isProcessing = false
const tickInterval = 5000
const prisma = new PrismaClient()

const log = (data: any) => console.log(`[${workerData.name}] ${data}`)
const error = (data: any) => console.error(`[${workerData.name}] ${data}`)
const getWorkerId = () => workerData.id

// Download from a given entity and include access to progress callbacks
function download(entity: Entity, onProgress: (chunkLength: number, totalLength: number) => void): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const outDir = path.join(STORAGE_PATH, entity.channel)
    const outPath = path.join(outDir, `${entity.title.replace(/[^a-zA-Z\d\s:]/g, "-")}.m4a`)

    if (!fs.existsSync(outDir)) {
      log(`Directory ${outDir} does not exist, creating...`)
      fs.mkdirSync(outDir)
    }

    // YoutubeDL provides incredible JSON files...
    const json = JSON.parse(entity.JSON) as YoutubedlResult

    // Pick a specific format to download
    let format: Format | null = null
    for (const item of json.formats) {
      if (item.acodec.includes("mp4") && item.vcodec === "none" && item.quality === 0) {
        format = item
        break
      }
    }

    if (format) {
      const { data, headers } = await axios({
        url: format.url,
        method: "GET",
        responseType: "stream",
      })
      const totalLength = headers["content-length"]

      log(`Creating write stream to ${outPath}`)
      const writer = fs.createWriteStream(outPath)
      await prisma.entity.update({ where: { id: entity.id }, data: { path: outPath } })

      data.on("data", (chunk: any) => onProgress(chunk.length, totalLength))
      data.on("error", (err: any) => reject(err))
      data.on("close", () => resolve())
      data.pipe(writer)
    } else {
      error(`Unable to find applicable format`)
    }
  })
}

// Process a single Queue instance
async function process(instance: Queue) {
  try {
    // Get a (async) lock for this instance
    await prisma.queue.update({ where: { id: instance.id }, data: { isRunning: true, workerId: getWorkerId() } })
    const entity = await prisma.entity.findFirst({ where: { id: instance?.entityId } })

    if (!entity) {
      log(`Could not find entity of id ${instance.entityId}`)
      return
    }

    let progress = 0
    // Create a handler for download progress callbacks that we can
    // then send to the client via websocket
    const onDownloadProgress = (chunk: number, total: number) => {
      progress += chunk

      const msg = {
        event: EVENT_DOWNLOAD_PROGRESS,
        entityId: instance?.entityId,
        progress: +((progress / total) * 100).toFixed(2),
      }

      parentPort?.postMessage(msg)
    }

    log(`Attempting to download ${entity?.title}`)

    await download(entity, onDownloadProgress)

    // Remove lock on this file and mark as completed
    await prisma.queue.update({
      where: { id: instance.id },
      data: { isRunning: false, workerId: null, completedAt: new Date() },
    })

    parentPort?.postMessage({
      event: EVENT_DOWNLOAD_COMPLETE,
      entityId: instance.entityId,
    })

    log(`Completed Queue[#${instance.id}]`)
  } catch (err) {
    // Remove lock on file and increment the error count
    await prisma.queue.update({
      where: { id: instance.id },
      data: {
        isRunning: false,
        workerId: null,
        hasErrored: true,
        errorCount: instance.errorCount + 1,
      },
    })

    parentPort?.postMessage({
      event: EVENT_DOWNLOAD_ERROR,
      entityId: instance.entityId,
    })
    error(err)
  }
}

// Marks a tick on the setInterval Function
// Will check the database for queue items
// and process them accordingly.
async function tick() {
  if (isProcessing) return
  isProcessing = true

  const nextQueueItem = await prisma.queue.findFirst({
    where: { completedAt: null, isRunning: false },
    orderBy: { createdAt: "asc" },
  })

  if (nextQueueItem) {
    await process(nextQueueItem)
  }

  isProcessing = false
}

function init() {
  log(`initialized`)
  setInterval(tick, tickInterval)
}

init()
