import React from "react"

export const LOCAL_STORAGE_KEY = "app:context"

export interface IAppContext {
  token: string | null
}

export const DEFAULT_VALUE = {
  token: "",
}

const AppContext = React.createContext<IAppContext>(DEFAULT_VALUE)

export const useAppContext = () => React.useContext(AppContext)

export default AppContext