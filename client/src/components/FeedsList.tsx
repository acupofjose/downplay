import { Block } from "baseui/block"
import React from "react"
import { REFRESH_ENTITIES } from "../events"

class FeedsList extends React.Component {
  componentDidMount() {
    PubSub.subscribe(REFRESH_ENTITIES, this.refresh)
  }

  componentWillUnmount() {
    PubSub.unsubscribe(this.refresh)
  }

  refresh = () => {}

  render() {
    return <Block></Block>
  }
}

export default FeedsList
