import axios from "axios"
import fs from "fs"
import path from "path"
import ffmpeg from "fluent-ffmpeg"
import { promisify } from "util"
import { parentPort, workerData } from "worker_threads"

import { PrismaClient, Queue, Entity } from "@prisma/client"
import { STORAGE_PATH } from "./constants"

import { EVENT_DOWNLOAD_COMPLETE, EVENT_DOWNLOAD_ERROR, EVENT_DOWNLOAD_PROGRESS, YoutubedlResult } from "./types"
import { ext } from "./util"

type DownloadItem = { key: "audio" | "thumbnail"; url: string; path: string; entity: Entity }
type ProgressCallback = (type: "audio" | "thumbnail" | "transcode", percent: number) => void

// Flag for put a lock on the tick function
let isProcessing = false
const tickInterval = 5000
const prisma = new PrismaClient()
const unlink = promisify(fs.unlink)

const log = (data: any) => console.log(`[${workerData.name}] ${data}`)
const error = (data: any) => console.error(`[${workerData.name}] ${data}`)
const getWorkerId = () => workerData.id

// Download from a given entity and include access to progress callbacks
async function handleDownload(entity: Entity, onProgress: ProgressCallback): Promise<void> {
  const downloads: DownloadItem[] = []

  const outDir = path.join(STORAGE_PATH, entity.channel)
  const title = entity.title.replace(/[^a-z0-9]/gi, "_")

  if (!fs.existsSync(outDir)) {
    log(`Directory ${outDir} does not exist, creating...`)
    fs.mkdirSync(outDir)
  }

  // YoutubeDL provides incredible JSON files...
  const json = JSON.parse(entity.JSON) as YoutubedlResult

  // Pick a specific format to download
  for (const format of json.formats) {
    if (format.acodec.includes("mp4") && format.vcodec === "none" && format.quality === 0) {
      downloads.push({ entity, key: "audio", url: format.url, path: path.join(outDir, `${title}.m4a`) })
      break
    }
  }

  // Thumbnail
  downloads.push({
    entity,
    key: "thumbnail",
    url: entity.thumbnailUrl,
    path: path.join(outDir, `${title}${ext(entity.thumbnailUrl)}`),
  })

  for (const item of downloads) {
    await download(item, onProgress)
  }
}

function download(item: DownloadItem, onProgress: ProgressCallback): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const { data, headers } = await axios({
      url: item.url,
      method: "GET",
      responseType: "stream",
    })
    const totalLength = headers["content-length"]

    log(`Creating write stream to ${item.path}`)
    const writer = fs.createWriteStream(item.path)

    switch (item.key) {
      case "audio":
        await prisma.entity.update({ where: { id: item.entity.id }, data: { path: item.path } })
        break
      case "thumbnail":
        await prisma.entity.update({ where: { id: item.entity.id }, data: { thumbnailPath: item.path } })
        break
    }

    let cursor = 0
    data.on("data", (chunk: any) => {
      cursor += chunk.length
      onProgress(item.key, +((cursor / totalLength) * 100).toFixed(2))
    })
    data.on("error", (err: any) => reject(err))
    data.on("close", async () => {
      if (item.key === "audio") {
        await transcode(item, onProgress)
      }
      resolve()
    })
    data.pipe(writer)
  })
}

function transcode(item: DownloadItem, onProgress: ProgressCallback): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(item.path)
    const newPath = item.path.replace(ext(item.path), ".mp3")

    console.log(`Transcoding ${item.path} to ${newPath}`)

    ffmpeg(stream)
      .audioCodec("libmp3lame")
      .audioQuality(0)
      .audioFilters("silencedetect=n=-50dB:d=5")
      .outputFormat("mp3")
      .on("progress", (progress) => onProgress("transcode", progress.percent))
      .on("error", (err) => reject(err))
      .on("end", async () => {
        console.log(`Transcoded ${newPath}`)
        await prisma.entity.update({ where: { id: item.entity.id }, data: { path: newPath } })
        await unlink(item.path)
        resolve()
      })
      .output(newPath)
      .run()
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

    // Create a handler for download progress callbacks that we can
    // then send to the client via websocket
    const onDownloadProgress = (type: "audio" | "thumbnail" | "transcode", percent: number) => {
      const msg = {
        event: EVENT_DOWNLOAD_PROGRESS,
        type,
        entityId: instance?.entityId,
        progress: percent,
      }
      parentPort?.postMessage(msg)
    }

    log(`Attempting to download ${entity?.title}`)

    await handleDownload(entity, onDownloadProgress)

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
