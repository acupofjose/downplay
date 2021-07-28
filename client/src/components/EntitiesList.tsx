import React from "react"
import { FlexGrid, FlexGridItem } from "baseui/flex-grid"
import { Entity, getEntities } from "../api"
import { Card, StyledAction, StyledBody } from "baseui/card"
import { splitter } from "../util"
import { Button } from "baseui/button"
import { ProgressBar } from "baseui/progress-bar"
import { REFRESH_ENTITIES, WEBSOCKET_MESSAGE } from "../events"
import PubSub from "pubsub-js"

class EntitiesList extends React.Component<any, { entities: Entity[]; progress: { [id: string]: number } }> {
  constructor(props: any) {
    super(props)

    this.state = {
      entities: [],
      progress: {},
    }
  }

  componentDidMount() {
    this.refresh()
    PubSub.subscribe(REFRESH_ENTITIES, this.refresh)
    PubSub.subscribe(WEBSOCKET_MESSAGE, this.handleWebsocketMessage)
  }

  componentWillUnmount() {
    PubSub.unsubscribe(this.refresh)
  }

  handleWebsocketMessage = (event: string, data: { event: string; entityId?: number; progress?: number }) => {
    if (data.event && data.entityId && data.progress) {
      const progress = { ...this.state.progress }

      const key = data.entityId.toString()
      progress[key] = data.progress

      this.setState({ ...this.state, progress })
    }
  }

  refresh = async () => {
    const result = await getEntities()
    if (result?.data) {
      this.setState({ entities: result.data })
    }
  }

  render() {
    return (
      <FlexGrid flexGridColumnCount={3} flexGridColumnGap="scale800" flexGridRowGap="scale800">
        {this.state.entities.map((entity) => (
          <FlexGridItem key={entity.id}>
            <Card>
              <StyledBody>
                <p>
                  <strong>{splitter(entity.title, 30)[0]}...</strong>
                </p>
                <p>{entity.channel}</p>
                <p>{splitter(entity.description, 128)[0]}</p>
              </StyledBody>
              <StyledAction>
                {(entity.queue.completedAt || this.state.progress[entity.id] === 100) && (
                  <Button overrides={{ BaseButton: { style: { width: "100%" } } }}>Listen</Button>
                )}
                {!entity.queue.completedAt && this.state.progress[entity.id] !== 100 && (
                  <ProgressBar size="large" value={this.state.progress[entity.id] || 0} successValue={100} />
                )}
              </StyledAction>
            </Card>
          </FlexGridItem>
        ))}
      </FlexGrid>
    )
  }
}

export default EntitiesList
