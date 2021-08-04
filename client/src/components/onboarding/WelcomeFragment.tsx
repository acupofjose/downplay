import { styled } from "baseui"
import { Block } from "baseui/block"
import React from "react"

const CenterText = styled("p", {
  textAlign: "center",
  fontSize: "1.25rem",
})

const WelcomeFragment = () => {
  return (
    <Block>
      <CenterText>A free, self-hostable, youtube-as-a-podcast service.</CenterText>
      <CenterText>Since this looks like your first run, let's get some configuration out of the way.</CenterText>
    </Block>
  )
}

export default WelcomeFragment
