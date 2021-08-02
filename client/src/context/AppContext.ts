import { Entity as PrismaEntity, Feed as PrismaFeed, Queue as PrismaQueue } from "@prisma/client"
import React from "react"

export const LOCAL_STORAGE_KEY = "app:context"

export interface IAppContext {
  token: string | null
  entities: PrismaEntity[]
  feeds: PrismaFeed[]
}

export const DEFAULT_VALUE = {
  token: "",
  entities: [],
  feeds: [],
}

const AppContext = React.createContext<IAppContext>(DEFAULT_VALUE)

export const useAppContext = () => React.useContext(AppContext)

export default AppContext
