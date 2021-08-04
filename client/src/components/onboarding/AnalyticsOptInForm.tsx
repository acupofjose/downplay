import React from "react"
import { FormControl } from "baseui/form-control"
import { Checkbox, STYLE_TYPE, LABEL_PLACEMENT } from "baseui/checkbox"
import { useOnboardingContext } from "../../context/OnboardingContext"

const AnalyticsOptInForm = () => {
  const context = useOnboardingContext()

  return (
    <>
      <FormControl
        caption={
          "Allows this instance to periodically send a heartbeat event to allow the developers to track the number of active instances."
        }>
        <Checkbox
          checked={context.config.allowHeartbeat}
          checkmarkType={STYLE_TYPE.toggle_round}
          onChange={(e) => context.setConfig!({ ...context.config, allowHeartbeat: e.currentTarget.checked })}
          labelPlacement={LABEL_PLACEMENT.right}>
          Enable Heartbeat
        </Checkbox>
      </FormControl>
      <FormControl caption={"Allows this instance to send error reports for debugging"}>
        <Checkbox
          checked={context.config.allowErrorReporting}
          checkmarkType={STYLE_TYPE.toggle_round}
          onChange={(e) => context.setConfig!({ ...context.config, allowErrorReporting: e.currentTarget.checked })}
          labelPlacement={LABEL_PLACEMENT.right}>
          Enable Error Reporting
        </Checkbox>
      </FormControl>
    </>
  )
}

export default AnalyticsOptInForm
