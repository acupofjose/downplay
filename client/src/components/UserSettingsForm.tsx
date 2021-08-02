import React from "react"
import { Block } from "baseui/block"
import { H1 } from "baseui/typography"
import { Card, StyledContents, StyledTitle } from "baseui/card"
import { FormControl } from "baseui/form-control"
import { Input } from "baseui/input"
import { Button } from "baseui/button"

const UserSettingsForm = () => {
  return (
    <React.Fragment>
      <Block maxWidth="900px" display="block" margin="10px auto">
        <Card overrides={{ Root: { style: { width: "100%" } } }}>
          <StyledTitle>User Settings</StyledTitle>
          <StyledContents>
            <FormControl label="Current Password">
              <Input name="password" type="password"></Input>
            </FormControl>
            <FormControl label="New Password">
              <Input name="new-password" type="password"></Input>
            </FormControl>
            <Button>Save</Button>
          </StyledContents>
        </Card>
      </Block>
    </React.Fragment>
  )
}

export default UserSettingsForm
