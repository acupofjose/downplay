import React from "react"
import { Modal, ModalBody, ModalButton, ModalFooter, ModalHeader, ROLE, SIZE } from "baseui/modal"
import AudioPlayer from "react-h5-audio-player"
import "react-h5-audio-player/lib/styles.css"
import { Entity as PrismaEntity } from "@prisma/client"
import Entity from "../api/entity"

export type PlayAudioModalProps = {
  entity?: PrismaEntity
  isOpen?: boolean
  size?: "default" | "auto" | "full"
  onClose?: () => void
}

const defaultProps: PlayAudioModalProps = {
  entity: undefined,
  isOpen: false,
  size: "default",
}

const PlayAudioModal = (props: PlayAudioModalProps) => {
  const [options, setOptions] = React.useState({ ...defaultProps, ...props })

  React.useMemo(() => setOptions(props), [props])

  if (!options.entity) return <React.Fragment />

  return (
    <Modal
      onClose={() => {
        setOptions({ ...options, isOpen: false })
        options.onClose?.apply(null)
      }}
      closeable
      isOpen={options.isOpen}
      animate
      autoFocus
      size={options.size}
      role={ROLE.dialog}>
      <ModalHeader>{options.entity?.title}</ModalHeader>
      <ModalBody>
        <AudioPlayer autoPlay src={Entity.getStreamingUrl(options.entity.id)} preload={"auto"} />
      </ModalBody>
    </Modal>
  )
}

export default PlayAudioModal
