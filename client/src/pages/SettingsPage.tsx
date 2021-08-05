import React from "react"
import UserSettingsForm from "../components/UserSettingsForm"
import { SystemSettingsForm } from "../components/SystemSettingsForm"
import { useAppContext } from "../context/AppContext"

const SettingsPage = () => {
  const context = useAppContext()
  return (
    <React.Fragment>
      {context.user?.isAdmin && <SystemSettingsForm />}
      <UserSettingsForm />
    </React.Fragment>
  )
}

export default SettingsPage
