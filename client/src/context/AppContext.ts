import React from "react"
import { Entity } from "../api"

export const LOCAL_STORAGE_KEY = "app:context"

export interface IAppContext {
  token: string | null
  entities: Entity[]
}

export const DEFAULT_VALUE = {
  token: "",
  entities: [],
}

const AppContext = React.createContext<IAppContext>(DEFAULT_VALUE)

export const useAppContext = () => React.useContext(AppContext)

export default AppContext
