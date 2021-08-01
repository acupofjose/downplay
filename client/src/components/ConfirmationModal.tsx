import React from "react"
import { Modal, ModalBody, ModalButton, ModalFooter, ModalHeader, ROLE, SIZE } from "baseui/modal"
import { KIND as ButtonKind } from "baseui/button"

export type ConfirmationModalProps = {
  title: string
  content?: string
  showCancel?: boolean
  cancelText?: string
  confirmText?: string
  onConfirm?: () => void
  onCancel?: () => void
  isOpen?: boolean
  size?: "default" | "auto" | "full"
}

const defaultProps: ConfirmationModalProps = {
  title: "",
  content: "",
  showCancel: true,
  cancelText: "Cancel",
  confirmText: "Okay",
  isOpen: false,
  size: "default",
}

const ConfirmationModal = (props: ConfirmationModalProps) => {
  const [options, setOptions] = React.useState({ ...defaultProps, ...props })

  React.useMemo(() => setOptions(props), [props])

  const onConfirm = () => {
    setOptions({ ...options, isOpen: false })
    options.onConfirm?.apply(null)
  }

  const onCancel = () => {
    setOptions({ ...options, isOpen: false })
    options.onCancel?.apply(null)
  }

  return (
    <Modal
      onClose={() => setOptions({ ...options, isOpen: false })}
      closeable
      isOpen={options.isOpen}
      animate
      autoFocus
      size={options.size}
      role={ROLE.dialog}>
      <ModalHeader>{options.title}</ModalHeader>
      {!!options.content && <ModalBody>{options.content}</ModalBody>}
      <ModalFooter>
        {options.showCancel && (
          <ModalButton onClick={onCancel} kind={ButtonKind.tertiary}>
            {options.cancelText}
          </ModalButton>
        )}
        <ModalButton onClick={onConfirm}>{options.confirmText}</ModalButton>
      </ModalFooter>
    </Modal>
  )
}

export default ConfirmationModal
