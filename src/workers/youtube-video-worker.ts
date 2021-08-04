import axios from "axios"
import fs from "fs"
import path from "path"
import ffmpeg from "fluent-ffmpeg"
import NodeID3 from "node-id3"

import Config, { ConfigItems } from "../config"
import { promisify } from "util"
import { parentPort, workerData } from "worker_threads"

import { PrismaClient, Queue, Entity, Channel } from "@prisma/client"
import { STORAGE_PATH } from "../constants"

import { EVENT_DOWNLOAD_COMPLETE, EVENT_DOWNLOAD_ERROR, EVENT_DOWNLOAD_PROGRESS, YoutubedlResult } from "../types"
import { ext, stream2buffer } from "../util"

const mime = require("mime")

type DownloadItem = {
  key: "audio" | "thumbnail"
  url: string
  path: string
  entity: Entity & { channel: Channel | null }
}

type ProgressCallback = (type: "audio" | "thumbnail" | "transcode", percent: number) => void

// Flag for put a lock on the tick function
let config: ConfigItems | undefined
let isProcessing = false
const tickInterval = 5000
const prisma = new PrismaClient()

const mkdir = promisify(fs.mkdir)
const exists = promisify(fs.exists)
const unlink = promisify(fs.unlink)

const log = (data: any) => console.log(`[${workerData.name}] ${data}`)
const error = (data: any) => console.error(`[${workerData.name}] ${data}`)
const getWorkerId = () => workerData.id

function init() {
  log(`initialized`)
  setInterval(tick, tickInterval)
}

/**
 * Marks a tick on the setInterval Function
 * Will check the database for queue items
 * and process them accordingly.
 * @returns
 */
async function tick() {
  if (isProcessing) return
  isProcessing = true

  config = await Config.refresh()

  const nextQueueItem = await prisma.queue.findFirst({
    where: { completedAt: null, isRunning: false },
    orderBy: { createdAt: "asc" },
  })

  if (nextQueueItem) {
    await process(nextQueueItem)
  }

  isProcessing = false
}

/**
 * Processes a queue instance by breaking it into download parts and
 * adding a `ProgressCallback` instance that passes its results up to the
 * `parentPort`
 *
 * @param instance
 * @returns
 */
async function process(instance: Queue) {
  try {
    // Get a (async) lock for this instance
    await prisma.queue.update({ where: { id: instance.id }, data: { isRunning: true, workerId: getWorkerId() } })
    const entity = await prisma.entity.findFirst({ where: { id: instance?.entityId }, include: { channel: true } })

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
        userId: instance.userId,
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

    if (!config?.shouldPersistJson) {
      await prisma.entity.update({
        where: { id: instance.entityId },
        data: { JSON: null },
      })
    }

    parentPort?.postMessage({
      event: EVENT_DOWNLOAD_COMPLETE,
      userId: instance.userId,
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

/**
 * Download from a given entity and include access to progress callbacks
 * Includes downloading a thumbnail as well as the actual audio file
 * @param entity
 * @param onProgress
 */
async function handleDownload(
  entity: Entity & { channel: Channel | null },
  onProgress: ProgressCallback
): Promise<void> {
  const downloads: DownloadItem[] = []

  const outDir = path.join(STORAGE_PATH, entity.userId, entity.channel!.name.replace(/[^a-z0-9]/gi, "_"))
  const title = entity.title.replace(/[^a-z0-9]/gi, "_")

  if (!(await exists(outDir))) {
    log(`Directory ${outDir} does not exist, creating...`)
    await mkdir(outDir, { recursive: true })
  }

  // YoutubeDL provides incredible JSON files...
  const json = JSON.parse(entity.JSON!) as YoutubedlResult

  // Thumbnail
  downloads.push({
    entity,
    key: "thumbnail",
    url: entity.thumbnailUrl,
    path: path.join(outDir, `${title}${ext(entity.thumbnailUrl)}`),
  })

  // Pick a specific format to download
  for (const format of json.formats) {
    if (format.acodec.includes("mp4") && format.vcodec === "none" && format.quality === 0) {
      downloads.push({ entity, key: "audio", url: format.url, path: path.join(outDir, `${title}.m4a`) })
      break
    }
  }

  for (const item of downloads) {
    await download(item, onProgress)
  }
}

/**
 * Downloads a given part of an entity (based on @param item)
 *
 * @param item
 * @param onProgress
 * @returns
 */
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
      if (item.key === "audio" && config?.shouldTranscodeAudio) {
        await transcode(item, onProgress)
      }
      resolve()
    })
    data.pipe(writer)
  })
}

/**
 * Transcodes a DownloadItem from `.*` to `.mp3`
 *
 * @param item
 * @param onProgress
 * @returns
 */
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
        await addId3Tags(item, newPath)
        resolve()
      })
      .output(newPath)
      .run()
  })
}

/**
 * Adds mp3 ID3 tags to a transcoded mp3
 * @param item
 * @param pathToMp3
 * @returns
 */
function addId3Tags(item: DownloadItem, pathToMp3: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    // Need the updated entity that has access to the downloaded information
    const entity = await prisma.entity.findFirst({ where: { id: item.entity.id }, include: { channel: true } })
    if (!entity) return

    const coverBuffer = await stream2buffer(fs.createReadStream(entity.thumbnailPath!))

    const tags: NodeID3.Tags = {
      title: entity.title,
      artist: entity.channel?.name,
      album: entity.channel?.name,
      date: entity.createdAt!.toLocaleString(),
      image: {
        mime: mime.getType(ext(entity.thumbnailPath!)),
        type: {
          id: 3,
          name: "front cover",
        },
        description: entity.description,
        imageBuffer: coverBuffer,
      },
    }

    NodeID3.write(tags, pathToMp3, (err) => {
      if (err) return reject(err)
      return resolve()
    })
  })
}

init()
