import { User as PrismaUser } from "@prisma/client"

namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: "development" | "production"
    PORT?: number
    JWT_SECRET?: string
  }
}

namespace Express {
  export interface User extends PrismaUser {
    _id: number
    username: string
  }
}
