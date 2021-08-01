import { PrismaClient } from ".prisma/client"
import { hash } from "./util"

const prisma = new PrismaClient()

const isFirstRun = async () => {
  var result = await prisma.meta.findFirst({ where: { key: "hasCompletedFirstRun" } })
  return result === null
}

const firstRunMigration = async () => {
  if (!(await isFirstRun())) return
  console.log(`Running 'firstRunMigration'`)

  const user = await prisma.user.create({
    data: {
      username: "admin",
      password: await hash("downplay"),
    },
  })

  await prisma.feed.create({
    data: {
      userId: user.id,
      title: "Default Feed",
      description: "Downplay's default feed",
      isDefault: true,
    },
  })

  if (!user) throw new Error("Unable to create default user, does the database exist?")

  await prisma.meta.upsert({
    create: { key: "hasCompletedFirstRun", value: "true" },
    update: { value: "true" },
    where: { key: "hasCompletedFirstRun" },
  })
}

export const migrate = async () => {
  await firstRunMigration()
}
