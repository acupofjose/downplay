import axios from "axios"
import fs from "fs"
import path from "path"
import { parentPort, workerData } from "worker_threads"
import { EVENT_DOWNLOAD_COMPLETE, EVENT_DOWNLOAD_PROGRESS, Format, YoutubedlResult } from "./types"
import { PrismaClient, Queue, Entity } from "@prisma/client"
import { STORAGE_PATH } from "./constants"

let isProcessing = false
const tickInterval = 5000
const prisma = new PrismaClient()

const log = (data: any) => console.log(`[${workerData.name}] ${data}`)
const error = (data: any) => console.error(`[${workerData.name}] ${data}`)
const getWorkerId = () => workerData.id

function download(entity: Entity, onProgress: (chunkLength: number, totalLength: number) => void): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const outDir = path.join(STORAGE_PATH, entity.channel)
    const outPath = path.join(outDir, `${entity.title.replace(/[^a-zA-Z\d\s:]/g, "-")}.m4a`)

    if (!fs.existsSync(outDir)) {
      log(`Directory ${outDir} does not exist, creating...`)
      fs.mkdirSync(outDir)
    }

    const json = JSON.parse(entity.JSON) as YoutubedlResult
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

async function process(instance: Queue) {
  await prisma.queue.update({ where: { id: instance.id }, data: { isRunning: true, workerId: getWorkerId() } })
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

    await download(entity, onDownloadProgress)

    await prisma.queue.update({
      where: { id: instance.id },
      data: { isRunning: false, workerId: null, completedAt: new Date() },
    })

    const msg = {
      event: EVENT_DOWNLOAD_COMPLETE,
      entityId: instance.entityId,
    }

    parentPort?.postMessage(msg)
    log(`Completed Queue[#${instance.id}]`)
  } catch (err) {
    error(err)
  }
}

async function tick() {
  if (isProcessing) return
  isProcessing = true

  const next = await prisma.queue.findFirst({
    where: { completedAt: null, isRunning: false },
    orderBy: { createdAt: "asc" },
  })

  if (next) {
    await process(next)
  }

  isProcessing = false
}

function init() {
  log(`initialized`)
  setInterval(tick, tickInterval)
}

init()
