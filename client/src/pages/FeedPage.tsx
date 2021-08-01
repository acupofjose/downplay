import React from "react"
import { Block } from "baseui/block"
import { H1 } from "baseui/typography"
import FeedsList from "../components/FeedsList"

const FeedPage = () => {
  return (
    <React.Fragment>
      <Block maxWidth="1200px" display="block" margin="10px auto">
        <H1>Feeds</H1>
        <FeedsList />
      </Block>
    </React.Fragment>
  )
}

export default FeedPage
