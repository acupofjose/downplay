import * as path from "path"
import { Worker } from "worker_threads"
import { Entity, PrismaClient, Queue } from "@prisma/client"
import { v4 as uuidv4 } from "uuid"
import socketManager from "./socket-manager"
import Config from "./config"
import PubSub from "pubsub-js"
import { CONFIG_CHANGED } from "./events"

const prisma: PrismaClient = new PrismaClient()

class WorkerManager {
  workerCount = 3
  queue: (Queue & { entity: Entity })[] = []
  processing: (Queue & { entity: Entity })[] = []
  workers: { [id: string]: Worker } = {}

  constructor() {
    PubSub.subscribe(CONFIG_CHANGED, async () => {
      await this.cleanup()
      await this.init()
    })
  }

  init = async () => {
    this.workerCount = Config.values.concurrentWorkers

    await this.spawnStaggeredWorkers()
    await this.cleanupBadExit()
  }

  cleanup = async () => {
    for (const [id, worker] of Object.entries(this.workers)) {
      await worker.terminate()
      delete this.workers[id]
    }
  }

  // On a bad exit, the database will be put in a state where some jobs will be marked as running
  // but will not have completed. To keep track of this, we have to assign workerIds and check if the
  // current state of the Queued job means that it is `actually` running, or is leftover from a previous
  // run.
  cleanupBadExit = async () => {
    const keys = Object.keys(this.workers)
    const potentialBadStates = await prisma.queue.findMany({ where: { isRunning: true, completedAt: null } })

    for (const state of potentialBadStates) {
      if (!state.workerId || (state.workerId && !keys.includes(state.workerId))) {
        await prisma.queue.update({ where: { id: state.id }, data: { isRunning: false, workerId: null } })
      }
    }
  }

  // Spawn workers, but stagger them so that their event loops checking for new jobs don't overlap.
  spawnStaggeredWorkers = () => {
    const promises: Promise<void>[] = []

    for (var i = Object.keys(this.workers).length; i < this.workerCount; i++) {
      promises.push(
        new Promise((resolve, reject) => {
          setTimeout(() => {
            this.spawn()
            resolve()
          }, 2000 * i)
        })
      )
    }

    return Promise.all(promises)
  }

  // Spawn an individual worker
  spawn = () => {
    if (Object.keys(this.workers).length + 1 > this.workerCount) return

    const id = uuidv4()
    const worker = new Worker(path.join(__dirname, "worker-loader.js"), {
      workerData: {
        path: "./worker.js",
        id,
        name: `worker-${id.substr(id.length - 4, id.length)}}`,
      },
    })

    worker.on("message", (message) => {
      try {
        JSON.parse(JSON.stringify(message))
        socketManager.broadcast(message)
      } catch {
        console.log(message)
      }
    })

    worker.on("error", (err) => {
      console.error(err)
    })

    worker.on("exit", () => {
      console.log(`Worker has exited.`)
      delete this.workers[id]
      this.spawnStaggeredWorkers()
    })

    this.workers[id] = worker
  }

  enqueue = async (entity: Entity) => {
    const queueItem = await prisma.queue.create({
      data: {
        userId: entity.userId,
        entityId: entity.id,
      },
      include: { entity: true },
    })
    return queueItem
  }
}

export default new WorkerManager()
