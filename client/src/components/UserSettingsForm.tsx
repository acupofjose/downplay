import React from "react"
import { Block } from "baseui/block"
import { Card, StyledContents, StyledTitle } from "baseui/card"
import { FormControl } from "baseui/form-control"
import { Input } from "baseui/input"
import { Button } from "baseui/button"
import Notification, { NotificationProps } from "./Notification"
import User from "../api/user"
import { USER_IS_LOGGING_OUT } from "../events"

const UserSettingsForm = () => {
  const [isLoading, setIsLoading] = React.useState(false)
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [notification, setNotification] = React.useState<NotificationProps>()

  const handleChangePassword = async () => {
    setNotification(undefined)
    if (!currentPassword || !newPassword) return

    setIsLoading(true)
    try {
      await User.changePassword(currentPassword, newPassword)

      setCurrentPassword("")
      setNewPassword("")
      setNotification({ kind: "positive", content: "Successfully changed passwords. Redirecting to login..." })

      setTimeout(() => PubSub.publish(USER_IS_LOGGING_OUT), 1500)
    } catch (err) {
      setNotification({ kind: "negative", content: err.message })
    }
    setIsLoading(false)
  }

  return (
    <React.Fragment>
      {notification && <Notification {...notification} />}
      <Block maxWidth="900px" display="block" margin="10px auto">
        <Card overrides={{ Root: { style: { width: "100%" } } }}>
          <StyledTitle>User Settings</StyledTitle>
          <StyledContents>
            <FormControl label="Current Password">
              <Input
                name="password"
                type="password"
                disabled={isLoading}
                onChange={(e) => setCurrentPassword(e.currentTarget.value)}></Input>
            </FormControl>
            <FormControl label="New Password">
              <Input
                name="new-password"
                type="password"
                disabled={isLoading}
                onChange={(e) => setNewPassword(e.currentTarget.value)}></Input>
            </FormControl>
            <Button onClick={handleChangePassword} isLoading={isLoading}>
              Save
            </Button>
          </StyledContents>
        </Card>
      </Block>
    </React.Fragment>
  )
}

export default UserSettingsForm
