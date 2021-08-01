import React from "react"
import { FlexGrid, FlexGridItem } from "baseui/flex-grid"
import { Entity, getEntities, getEntityThumbnailUrl } from "../api"
import { Card, StyledAction, StyledBody } from "baseui/card"
import { splitter } from "../util"
import { Button } from "baseui/button"
import { ProgressBar } from "baseui/progress-bar"
import { PLAY_ENTITY, REFRESH_ENTITIES, WEBSOCKET_MESSAGE, WEBSOCKET_OPEN } from "../events"
import PubSub from "pubsub-js"
import { Block } from "baseui/block"

type EntitiesListProps = { entities: Entity[]; progress: { [id: string]: number }; status: { [id: string]: string } }

class EntitiesList extends React.Component<any, EntitiesListProps> {
  constructor(props: any) {
    super(props)

    this.state = {
      entities: [],
      progress: {},
      status: {},
    }
  }

  componentDidMount() {
    this.refresh()
    PubSub.subscribe(WEBSOCKET_OPEN, this.refresh)
    PubSub.subscribe(REFRESH_ENTITIES, this.refresh)
    PubSub.subscribe(WEBSOCKET_MESSAGE, this.handleWebsocketMessage)
  }

  componentWillUnmount() {
    PubSub.unsubscribe(this.refresh)
    PubSub.unsubscribe(this.handleWebsocketMessage)
  }

  handleWebsocketMessage = (
    event: string,
    data: { event: string; type: string; entityId?: number; progress?: number }
  ) => {
    if (data.event && data.entityId && data.progress) {
      const progress = { ...this.state.progress }
      const status = { ...this.state.status }

      const key = data.entityId.toString()
      progress[key] = data.progress
      status[key] = data.type

      this.setState({ ...this.state, progress, status })
    }
  }

  refresh = async () => {
    const result = await getEntities()
    if (result) {
      this.setState({ entities: result })
    }
  }

  emitPlayEntity = (entityId: string) => {
    PubSub.publish(PLAY_ENTITY, entityId)
  }

  render() {
    return (
      <Block margin="10px">
        <FlexGrid
          flexGridColumnCount={this.state.entities.length > 0 ? [1, 1, 2, 5] : [1]}
          flexGridColumnGap="scale800"
          flexGridRowGap="scale800">
          {this.state.entities.length === 0 && (
            <FlexGridItem
              overrides={{
                Block: { style: { display: "block", margin: "0 auto", maxWidth: "350px", textAlign: "center" } },
              }}>
              <Card>
                <StyledBody>Why not add some URLs up there?</StyledBody>
              </Card>
            </FlexGridItem>
          )}
          {this.state.entities.map((entity) => (
            <FlexGridItem key={entity.id}>
              <Card headerImage={getEntityThumbnailUrl(entity.id)}>
                <StyledBody>
                  <p>
                    <strong>{splitter(entity.title, 30)[0]}...</strong>
                  </p>
                  <p>{entity.channel}</p>
                  <p>{splitter(entity.description, 128)[0]}</p>
                </StyledBody>
                <StyledAction>
                  {(entity.queue.completedAt || this.state.progress[entity.id] === 100) && (
                    <Button
                      overrides={{ BaseButton: { style: { width: "100%" } } }}
                      onClick={() => this.emitPlayEntity(entity.id)}>
                      Listen
                    </Button>
                  )}
                  {!entity.queue.completedAt && this.state.progress[entity.id] !== 100 && (
                    <ProgressBar
                      size="large"
                      value={this.state.progress[entity.id] || 0}
                      successValue={100}
                      showLabel={true}
                      getProgressLabel={() => this.state.status[entity.id]}
                    />
                  )}
                </StyledAction>
              </Card>
            </FlexGridItem>
          ))}
        </FlexGrid>
      </Block>
    )
  }
}

export default EntitiesList
