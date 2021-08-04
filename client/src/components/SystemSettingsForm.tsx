import React from "react"
import { Checkbox, STYLE_TYPE, LABEL_PLACEMENT } from "baseui/checkbox"
import { FormControl } from "baseui/form-control"
import { Input } from "baseui/input"
import Config, { ConfigItems } from "../api/config"
import { Block } from "baseui/block"
import { Card, StyledTitle, StyledContents } from "baseui/card"
import { Button } from "baseui/button"
import Notification, { NotificationProps } from "./Notification"

export const SystemSettingsForm = () => {
  const [state, setState] = React.useState<ConfigItems>({})
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [notification, setNotification] = React.useState<NotificationProps>()

  const refresh = async () => {
    setIsLoading(true)
    const config = await Config.get()
    if (config) {
      setState(config)
    }
    setIsLoading(false)
  }

  const save = async () => {
    setIsLoading(true)
    if (Object.keys(state).length > 0) {
      try {
        await Config.set(state)
        setNotification({ content: "Successfully saved settings", kind: "positive" })
      } catch (err) {
        setNotification({ content: err, kind: "negative" })
      }
    }
    setIsLoading(false)
  }

  React.useEffect(() => {
    refresh()
  }, [])

  return (
    <Block maxWidth="900px" display="block" margin="10px auto">
      {!!notification && <Notification content={notification.content} kind={notification.kind}></Notification>}
      <Card overrides={{ Root: { style: { width: "100%" } } }}>
        <StyledTitle>System Settings</StyledTitle>
        <StyledContents>
          <FormControl
            label={"Youtube API Key"}
            caption={"Required to watch channels for new videos, optional otherwise."}>
            <Input
              type="password"
              value={state.youtubeApiKey}
              disabled={isLoading}
              onChange={(e) => setState!({ ...state, youtubeApiKey: e.currentTarget.value })}
            />
          </FormControl>
          <FormControl
            label={"Concurrent Workers"}
            caption={"Specifies the number of concurrent background jobs can be processed."}>
            <Input
              type="number"
              disabled={isLoading}
              value={state.concurrentWorkers}
              onChange={(e) => setState!({ ...state, concurrentWorkers: parseInt(e.currentTarget.value) })}
            />
          </FormControl>
          <FormControl caption={"If true, downloaded audio will be transcoded into `.mp3` format with ID3 tagging."}>
            <Checkbox
              checked={state.shouldTranscodeAudio}
              disabled={isLoading}
              checkmarkType={STYLE_TYPE.toggle_round}
              onChange={(e) => setState!({ ...state, shouldTranscodeAudio: e.currentTarget.checked })}
              labelPlacement={LABEL_PLACEMENT.right}>
              Enable Audio Transcoding
            </Checkbox>
          </FormControl>
          <FormControl caption="Allows other users to register accounts.">
            <Checkbox
              checked={state.allowRegistration}
              disabled={isLoading}
              checkmarkType={STYLE_TYPE.toggle_round}
              onChange={(e) => setState!({ ...state, allowRegistration: e.currentTarget.checked })}
              labelPlacement={LABEL_PLACEMENT.right}>
              Enable User Registeration
            </Checkbox>
          </FormControl>
          <FormControl
            caption={
              "If true, JSON data will be kept in the database (this should be `false` for almost all use cases)"
            }>
            <Checkbox
              checked={state.shouldPersistJson}
              checkmarkType={STYLE_TYPE.toggle_round}
              onChange={(e) => setState({ ...state, shouldPersistJson: e.currentTarget.checked })}
              labelPlacement={LABEL_PLACEMENT.right}>
              Persist JSON Data
            </Checkbox>
          </FormControl>
          <FormControl
            caption={
              "Allows this instance to periodically send a heartbeat event to allow the developers to track the number of active instances."
            }>
            <Checkbox
              checked={state.allowHeartbeat}
              disabled={isLoading}
              checkmarkType={STYLE_TYPE.toggle_round}
              onChange={(e) => setState!({ ...state, allowHeartbeat: e.currentTarget.checked })}
              labelPlacement={LABEL_PLACEMENT.right}>
              Enable Heartbeat
            </Checkbox>
          </FormControl>
          <FormControl caption={"Allows this instance to send error reports for debugging"}>
            <Checkbox
              checked={state.allowErrorReporting}
              disabled={isLoading}
              checkmarkType={STYLE_TYPE.toggle_round}
              onChange={(e) => setState!({ ...state, allowErrorReporting: e.currentTarget.checked })}
              labelPlacement={LABEL_PLACEMENT.right}>
              Enable Error Reporting
            </Checkbox>
          </FormControl>
          <Button onClick={save}>Save</Button>
        </StyledContents>
      </Card>
    </Block>
  )
}
