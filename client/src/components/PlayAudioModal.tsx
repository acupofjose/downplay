import React from "react"
import { Modal, ModalBody, ModalButton, ModalFooter, ModalHeader, ROLE, SIZE } from "baseui/modal"
import { KIND as ButtonKind } from "baseui/button"
import { Entity, getEntityStreamingUrl } from "../api"

export type PlayAudioModalProps = {
  entity?: Entity
  isOpen?: boolean
  size?: "default" | "auto" | "full"
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
      onClose={() => setOptions({ ...options, isOpen: false })}
      closeable
      isOpen={options.isOpen}
      animate
      autoFocus
      size={options.size}
      role={ROLE.dialog}>
      <ModalHeader>{options.entity?.title}</ModalHeader>
      <ModalBody>
        <video controls={true} autoPlay={true}>
          <source src={getEntityStreamingUrl(options.entity!.id)}></source>
        </video>
      </ModalBody>
    </Modal>
  )
}

export default PlayAudioModal
