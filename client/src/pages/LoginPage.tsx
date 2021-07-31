import React from "react"
import { FormControl } from "baseui/form-control"
import { Input } from "baseui/input"
import { styled, useStyletron } from "baseui"
import { ButtonGroup, SIZE, SHAPE } from "baseui/button-group"
import { Button, KIND } from "baseui/button"
import { Notification } from "baseui/notification"
import { Card } from "baseui/card"
import { useAppContext } from "../context/AppContext"
import { login, register } from "../api"
import { AUTH_LOGIN, AUTH_REGISTER } from "../events"

const LoginPage = () => {
  const appContext = useAppContext()
  const [css, theme] = useStyletron()
  const [isLoggingIn, setIsLoggingIn] = React.useState(false)
  const [isRegistering, setIsRegistering] = React.useState(false)
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const handleLoginClick = async () => {
    if (!username || !password) return

    setError(null)
    setIsLoggingIn(true)

    try {
      const result = await login(username, password)
      PubSub.publish(AUTH_LOGIN, result.token)
    } catch (err) {
      setError("Unable to login using these credentials")
    }

    setIsLoggingIn(false)
  }

  const handleRegisterClick = async () => {
    if (!username || !password) return
    setError(null)
    setIsRegistering(true)

    try {
      const result = await register(username, password)
      PubSub.publish(AUTH_REGISTER, result.token)
    } catch (err) {
      setError("Unable to register using these credentials.")
    }

    setIsRegistering(false)
  }

  const handleForgotPasswordClick = () => {}

  return (
    <Card
      overrides={{
        Root: {
          style: {
            alignItems: "center",
            flexDirection: "column",
            maxWidth: "400px",
            margin: "20px auto",
            padding: "10px",
          },
        },
      }}>
      {!!error && (
        <Notification kind={"negative"} overrides={{ Body: { style: { width: "100%", boxSizing: "border-box" } } }}>
          {() => error}
        </Notification>
      )}
      <FormControl label={"Username"}>
        <Input onChange={(e) => setUsername(e.currentTarget.value)} />
      </FormControl>
      <FormControl label={"Password"}>
        <Input onChange={(e) => setPassword(e.currentTarget.value)} />
      </FormControl>
      <div className={css({ display: "flex", flexDirection: "column", alignItems: "center" })}>
        <ButtonGroup size={SIZE.large} shape={SHAPE.default}>
          <Button
            kind={KIND.primary}
            onClick={handleLoginClick}
            isLoading={isLoggingIn}
            disabled={isLoggingIn || isRegistering}>
            Login
          </Button>
          <Button
            kind={KIND.secondary}
            onClick={handleRegisterClick}
            isLoading={isRegistering}
            disabled={isLoggingIn || isRegistering}>
            Register
          </Button>
        </ButtonGroup>
        <Button
          size={SIZE.mini}
          onClick={handleForgotPasswordClick}
          disabled={isLoggingIn || isRegistering}
          kind={KIND.minimal}>
          Forgot Password?
        </Button>
      </div>
    </Card>
  )
}

export default LoginPage
