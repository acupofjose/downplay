import React from "react"
import { FlexGrid, FlexGridItem } from "baseui/flex-grid"
import { Card, StyledAction, StyledBody } from "baseui/card"
import { splitter } from "../util"
import { Button } from "baseui/button"
import { ProgressBar } from "baseui/progress-bar"
import {
  DOWNLOAD_IS_COMPLETE,
  PLAY_REQUESTED_ENTITY,
  REFRESH_ENTITIES,
  WEBSOCKET_HAS_MESSAGE,
  WEBSOCKET_HAS_OPENED,
} from "../events"
import PubSub from "pubsub-js"
import { Block } from "baseui/block"
import { Delete } from "baseui/icon"
import ConfirmationModal, { ConfirmationModalProps } from "./ConfirmationModal"
import AppContext from "../context/AppContext"
import { Entity as PrismaEntity, Queue as PrismaQueue, Channel as PrismaChannel } from "@prisma/client"
import Entity from "../api/entity"

type EntitiesListState = {
  entities: (PrismaEntity & { queue: PrismaQueue })[]
  progress: { [id: string]: number }
  status: { [id: string]: string }
  showConfirmationModal: boolean
  confirmationModalProps?: ConfirmationModalProps
}

class EntitiesList extends React.Component<any, EntitiesListState> {
  constructor(props: any) {
    super(props)

    this.state = {
      entities: [],
      progress: {},
      status: {},
      showConfirmationModal: false,
    }
  }

  componentDidMount() {
    PubSub.subscribe(WEBSOCKET_HAS_MESSAGE, this.handleWebsocketMessage)
  }

  componentWillUnmount() {
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

    if (data.event === DOWNLOAD_IS_COMPLETE) {
      PubSub.publish(REFRESH_ENTITIES)
    }
  }

  handleDeleteEntity = async (entityId: string) => {
    this.setState({
      showConfirmationModal: true,
      confirmationModalProps: {
        title: `Are you sure?`,
        content: `This will delete all data, thumbnails, and files related to Entity[${entityId}].`,
        confirmText: "Delete",
        showCancel: true,
        cancelText: "Cancel",
        isOpen: true,
        onConfirm: async () => {
          await Entity.delete(entityId)
          PubSub.publish(REFRESH_ENTITIES)
          this.setState({ ...this.state, showConfirmationModal: false })
        },
        onCancel: () => this.setState({ ...this.state, showConfirmationModal: false }),
      },
    })
  }

  render() {
    return (
      <Block margin="10px auto" padding="10px" maxWidth="900px" display="block">
        <FlexGrid
          flexGridColumnCount={this.state.entities.length > 0 ? [1, 1, 4, 4] : [1]}
          flexGridColumnGap="scale800"
          flexGridRowGap="scale800">
          {this.context.entities.length === 0 && (
            <FlexGridItem
              overrides={{
                Block: { style: { display: "block", margin: "0 auto", textAlign: "center" } },
              }}>
              <Card>
                <StyledBody>Why not add some URLs up there?</StyledBody>
              </Card>
            </FlexGridItem>
          )}
          {this.context.entities.map((entity: PrismaEntity & { queue: PrismaQueue; channel: PrismaChannel }) => (
            <FlexGridItem
              key={entity.id}
              overrides={{ Block: { style: { position: "relative", maxWidth: "400px", margin: "1rem" } } }}>
              <Block position="absolute" top="0" right="0">
                <Button
                  kind="minimal"
                  onClick={() => this.handleDeleteEntity(entity.id)}
                  overrides={{ BaseButton: { style: { backgroundColor: "#333", padding: "0.5rem" } } }}>
                  <Delete size="2rem" />
                </Button>
              </Block>
              <Card
                headerImage={entity.thumbnailPath ? Entity.getThumbnailUrl(entity.id) : ""}
                overrides={{ HeaderImage: { style: { minWidth: "100%" } } }}>
                <StyledBody>
                  <p>
                    <strong>{splitter(entity.title, 30)[0]}...</strong>
                  </p>
                  <p>{entity.channel.name}</p>
                  <p>{splitter(entity.description, 128)[0]}</p>
                </StyledBody>
                <StyledAction>
                  {(entity.queue.completedAt || this.state.progress[entity.id] === 100) && (
                    <Button
                      overrides={{ BaseButton: { style: { width: "100%" } } }}
                      onClick={() => PubSub.publish(PLAY_REQUESTED_ENTITY, entity.id)}>
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
        {this.state.showConfirmationModal && !!this.state.confirmationModalProps && (
          <ConfirmationModal {...this.state.confirmationModalProps} />
        )}
      </Block>
    )
  }
}

EntitiesList.contextType = AppContext
export default EntitiesList
