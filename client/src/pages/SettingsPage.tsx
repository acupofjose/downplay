import React from "react"
import { Block } from "baseui/block"
import { H1 } from "baseui/typography"
import { Card, StyledContents, StyledTitle } from "baseui/card"
import { FormControl } from "baseui/form-control"
import { Input } from "baseui/input"
import { Button } from "baseui/button"
import UserSettingsForm from "../components/UserSettingsForm"

const SettingsPage = () => {
  return (
    <React.Fragment>
      <Block maxWidth="900px" display="block" margin="10px auto">
        <Card overrides={{ Root: { style: { width: "100%" } } }}>
          <StyledTitle>Settings</StyledTitle>
          <StyledContents>
            <FormControl label="Concurrent Workers">
              <Input></Input>
            </FormControl>
          </StyledContents>
        </Card>
        <UserSettingsForm />
      </Block>
    </React.Fragment>
  )
}

export default SettingsPage
