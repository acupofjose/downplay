import {
  Entity as PrismaEntity,
  Feed as PrismaFeed,
  User as PrismaUser,
  Channel as PrismaChannel,
} from "@prisma/client"
import React from "react"
import { ConfigStatus } from "../api/config"

export const LOCAL_STORAGE_KEY = "app:context"

export interface IAppContext {
  token: string | null
  entities: PrismaEntity[]
  feeds: PrismaFeed[]
  channels: PrismaChannel[]
  user: PrismaUser | undefined
  status: ConfigStatus
}

export const DEFAULT_VALUE: IAppContext = {
  token: "",
  channels: [],
  user: undefined,
  entities: [],
  feeds: [],
  status: {
    initialized: false,
    config: {
      allowErrorReporting: false,
      allowHeartbeart: false,
      allowRegistration: false,
    },
  },
}

const AppContext = React.createContext<IAppContext>(DEFAULT_VALUE)

export const useAppContext = () => React.useContext(AppContext)

export default AppContext
