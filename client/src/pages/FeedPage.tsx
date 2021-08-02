import React from "react"
import { Block } from "baseui/block"
import { H1 } from "baseui/typography"
import { Card, StyledContents, StyledTitle } from "baseui/card"
import { Accordion, Panel } from "baseui/accordion"
import { ListItem, ListItemLabel } from "baseui/list"
import { useAppContext } from "../context/AppContext"
import { Entity as PrismaEntity, Feed as PrismaFeed } from "@prisma/client"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlay, faRss } from "@fortawesome/free-solid-svg-icons"
import { Button } from "baseui/button"
import Feed from "../api/feed"
import { PLAY_ENTITY } from "../events"

const FeedPage = () => {
  const context = useAppContext()

  const openFeedXml = (feedId: string) => {
    window.open(Feed.xmlUrl(feedId), "__blank")
  }

  return (
    <React.Fragment>
      <Block maxWidth="900px" display="block" margin="10px auto">
        <Card overrides={{ Root: { style: { width: "100%" } } }}>
          <StyledTitle>Feeds</StyledTitle>
          <StyledContents>
            <Accordion>
              {context.feeds.map((feed: PrismaFeed) => (
                <Panel
                  title={
                    <div>
                      <Block display="inline-block" marginRight="1rem">
                        <Button size="mini" kind="minimal" onClick={() => openFeedXml(feed.id)}>
                          <FontAwesomeIcon icon={faRss} />
                        </Button>
                      </Block>
                      {feed.title}
                    </div>
                  }
                  expanded={true}>
                  {context.entities
                    .filter((e) => e.feedId === feed.id)
                    .sort((a, b) => (a.title > b.title ? 1 : -1))
                    .map((entity: PrismaEntity) => (
                      <ListItem
                        endEnhancer={() => (
                          <Button kind="minimal" size="mini" onClick={() => PubSub.publish(PLAY_ENTITY, entity.id)}>
                            <FontAwesomeIcon icon={faPlay} />
                          </Button>
                        )}>
                        <ListItemLabel>{entity.title}</ListItemLabel>
                      </ListItem>
                    ))}
                </Panel>
              ))}
            </Accordion>
          </StyledContents>
        </Card>
      </Block>
    </React.Fragment>
  )
}

export default FeedPage
