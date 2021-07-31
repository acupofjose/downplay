import React from "react"
import { Input } from "baseui/input"
import { styled, useStyletron } from "baseui"
import { Button } from "baseui/button"
import { enqueue } from "../api"
import { REFRESH_ENTITIES } from "../events"

const Centered = styled("div", {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
  margin: "30px",
  boxSizing: "border-box",
})

const RequestForm = () => {
  const [css, theme] = useStyletron()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [youtubeUrl, setYoutubeUrl] = React.useState<string>()

  const onSubmitClick = async () => {
    const regex =
      /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/

    if (youtubeUrl && regex.test(youtubeUrl)) {
      setIsLoading(true)

      await enqueue(youtubeUrl)
      PubSub.publish(REFRESH_ENTITIES)
      setYoutubeUrl("")

      setIsLoading(false)
    }
  }

  return (
    <Centered>
      <div
        className={css({
          display: "flex",
          border: `15px solid ${theme.colors.black}`,
          borderRadius: "10px",
          minWidth: "450px",
        })}>
        <Input
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
