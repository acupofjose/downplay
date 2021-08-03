import React from "react"
import { Input } from "baseui/input"
import { styled, useStyletron } from "baseui"
import { Button } from "baseui/button"
import { Select } from "baseui/select"
import { REFRESH_ENTITIES } from "../events"
import Queue from "../api/queue"

const Centered = styled("div", {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
  margin: "10px",
  marginBottom: "30px",
  boxSizing: "border-box",
})

const RequestForm = () => {
  const [css, theme] = useStyletron()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [youtubeUrl, setYoutubeUrl] = React.useState<string>("")
  const [error, setError] = React.useState<string>()

  const onSubmitClick = async () => {
    const regex =
      /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/

    setError("")
    if (youtubeUrl && regex.test(youtubeUrl)) {
      setIsLoading(true)

      await Queue.enqueue(youtubeUrl)
      PubSub.publish(REFRESH_ENTITIES)

      setIsLoading(false)
      setYoutubeUrl("")
    } else {
      setError("Url is not recognized.")
    }
  }

  return (
    <Centered>
      <div
        className={css({
          display: "flex",
          border: `15px solid ${theme.colors.black}`,
          borderRadius: "10px",
          width: "450px",
          maxWidth: "100%",
        })}>
        <Input
          value={youtubeUrl}
          placeholder={"Any url parsable by youtube-dl"}
          onChange={(e) => setYoutubeUrl(e.currentTarget.value)}
          endEnhancer={() => {}}
          clearOnEscape={true}
          clearable={true}
          disabled={isLoading}
        />
        <Button onClick={onSubmitClick} isLoading={isLoading}>
          Submit
        </Button>
      </div>
    </Centered>
  )
}

export default RequestForm
