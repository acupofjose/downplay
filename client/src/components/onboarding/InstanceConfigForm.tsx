import React from "react"
import { FormControl } from "baseui/form-control"
import { Input } from "baseui/input"
import { Checkbox, STYLE_TYPE, LABEL_PLACEMENT } from "baseui/checkbox"
import { useOnboardingContext } from "../../context/OnboardingContext"

const InstanceConfigForm = () => {
  const context = useOnboardingContext()

  return (
    <>
      <FormControl label={"Youtube API Key"} caption={"Required to watch channels for new videos, optional otherwise."}>
        <Input
          type="password"
          value={context.config.youtubeApiKey}
          onChange={(e) => context.setConfig!({ ...context.config, youtubeApiKey: e.currentTarget.value })}
        />
      </FormControl>
      <FormControl
        label={"Concurrent Workers"}
        caption={"Specifies the number of concurrent background jobs can be processed."}>
        <Input
          type="number"
          value={context.config.concurrentWorkers}
          onChange={(e) =>
            context.setConfig!({ ...context.config, concurrentWorkers: parseInt(e.currentTarget.value) })
          }
        />
      </FormControl>
      <FormControl caption={"If true, downloaded audio will be transcoded into `.mp3` format with ID3 tagging."}>
        <Checkbox
          checked={context.config.shouldTranscodeAudio}
          checkmarkType={STYLE_TYPE.toggle_round}
          onChange={(e) => context.setConfig!({ ...context.config, shouldTranscodeAudio: e.currentTarget.checked })}
          labelPlacement={LABEL_PLACEMENT.right}>
          Enable Audio Transcoding
        </Checkbox>
      </FormControl>
      <FormControl
        caption={"If true, JSON data will be kept in the database (this should be `false` for almost all use cases)"}>
        <Checkbox
          checked={context.config.shouldPersistJson}
          checkmarkType={STYLE_TYPE.toggle_round}
          onChange={(e) => context.setConfig!({ ...context.config, shouldPersistJson: e.currentTarget.checked })}
          labelPlacement={LABEL_PLACEMENT.right}>
          Persist JSON Data
        </Checkbox>
      </FormControl>
      <FormControl caption="Allows other users to register accounts.">
        <Checkbox
          checked={context.config.allowRegistration}
          checkmarkType={STYLE_TYPE.toggle_round}
          onChange={(e) => context.setConfig!({ ...context.config, allowRegistration: e.currentTarget.checked })}
          labelPlacement={LABEL_PLACEMENT.right}>
          Enable User Registeration
        </Checkbox>
      </FormControl>
    </>
  )
}

export default InstanceConfigForm
