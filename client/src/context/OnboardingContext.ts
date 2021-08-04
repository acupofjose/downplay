import React from "react"
import { ConfigItems } from "../api/config"

export interface IOnboardingContext {
  auth: {
    username?: string
    password?: string
  }
  config: ConfigItems
  isProcessing: boolean
  setAuth?: (auth: { username?: string; password?: string }) => void
  setConfig?: (items: ConfigItems) => void
  setIsProcessing?: (isProcessing: boolean) => void
}

export const DEFAULT_VALUE: IOnboardingContext = {
  auth: {},
  config: {},
  isProcessing: false,
}

const OnboardingContext = React.createContext<IOnboardingContext>(DEFAULT_VALUE)

export const useOnboardingContext = () => React.useContext(OnboardingContext)

export default OnboardingContext
