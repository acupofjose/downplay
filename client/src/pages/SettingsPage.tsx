import React from "react"
import { Block } from "baseui/block"
import { H1 } from "baseui/typography"
import { Card, StyledContents, StyledTitle } from "baseui/card"
import { FormControl } from "baseui/form-control"
import { Input } from "baseui/input"
import { Button } from "baseui/button"
import UserSettingsForm from "../components/UserSettingsForm"
import { Checkbox, STYLE_TYPE, LABEL_PLACEMENT } from "baseui/checkbox"
import { ConfigItems } from "../api/config"
import { SystemSettingsForm } from "../components/SystemSettingsForm"

const SettingsPage = () => {
  return (
    <React.Fragment>
      <SystemSettingsForm />
      <UserSettingsForm />
    </React.Fragment>
  )
}

export default SettingsPage
