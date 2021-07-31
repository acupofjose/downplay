import React from "react"

export const LOCAL_STORAGE_KEY = "app:context"

export interface IAppContext {
  token: string | null
}

const AppContext = React.createContext<IAppContext>({
  token: "",
})

export const useAppContext = () => React.useContext(AppContext)

export default AppContext
