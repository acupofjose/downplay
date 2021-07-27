import * as path from "path"
import { Worker } from "worker_threads"
import { Entity, PrismaClient, Queue } from "@prisma/client"
import socketManager from "./socket-manager"

class WorkerManager {
  maxQueueSize = 3
  queue: (Queue & { entity: Entity })[] = []
  processing: (Queue & { entity: Entity })[] = []
  prisma: PrismaClient = new PrismaClient()
  worker: Worker

  constructor() {
    console.log(`Starting worker...`)
    this.worker = new Worker(path.join(__dirname, "worker-loader.js"), {
      workerData: {
        path: "./worker.js",
      },
    })

    this.worker.on("message", (message) => {
      try {
        JSON.parse(JSON.stringify(message))
        socketManager.broadcast(message)
      } catch {
        console.log(message)
      }
    })

    this.worker.on("error", (err) => {
      console.error(err)
    })

    this.worker.on("exit", () => {
      console.log(`Worker has exited.`)
    })
  }

  enqueue = async (entity: Entity) => {
    await this.prisma.queue.create({
      data: {
        entityId: entity.id,
      },
      include: { entity: true },
    })
  }
}

export default new WorkerManager()
