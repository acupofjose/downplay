import * as React from "react"
import { Notification as BaseNotification } from "baseui/notification"

export type NotificationProps = {
  kind?: "info" | "warning" | "positive" | "negative"
  closeable?: boolean
  onClose?: () => void
  autoHideDuration?: number
  content?: string
}

const defaults: NotificationProps = {
  kind: "info",
  closeable: true,
  autoHideDuration: 5000,
}

const Notification = (props: NotificationProps) => {
  return (
    <BaseNotification
      {...defaults}
      {...props}
      overrides={{ Body: { style: { position: "fixed", top: "2rem", right: "2rem", zIndex: 1000 } } }}>
      {() => props.content}
    </BaseNotification>
  )
}

export default Notification
