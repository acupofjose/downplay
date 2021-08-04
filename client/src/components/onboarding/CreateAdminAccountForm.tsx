import React from "react"
import { FormControl } from "baseui/form-control"
import { Input } from "baseui/input"
import { useOnboardingContext } from "../../context/OnboardingContext"

const CreateAdminAccountForm = ({}) => {
  const context = useOnboardingContext()

  return (
    <>
      <FormControl label={"Username"}>
        <Input
          name="username"
          disabled={context.isProcessing}
          onChange={(e) => context.setAuth!({ ...context.auth, username: e.currentTarget.value })}
        />
      </FormControl>
      <FormControl label={"Password"}>
        <Input
          name="password"
          type="password"
          disabled={context.isProcessing}
          onChange={(e) => context.setAuth!({ ...context.auth, password: e.currentTarget.value })}
          clearOnEscape={true}
        />
      </FormControl>
    </>
  )
}

export default CreateAdminAccountForm
