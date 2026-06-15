import { useEffect, useState } from 'react'

export type CharacterAiImageGeneratePayload = {
  prompt: string
  styleKey: string
  referenceImageUrl?: string | null
}

type CharacterAiImageFlowProps = {
  open: boolean
  onClose: () => void
  onConfirm: (imageUrl: string) => void
}

export function CharacterAiImageFlow({
  open,
  onClose,
  onConfirm,
}: CharacterAiImageFlowProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)
  const [session, setSession] = useState<CharacterAiImageGeneratePayload | null>(null)
  const [initialValues, setInitialValues] = useState<CharacterAiImageGeneratePayload | null>(null)

  useEffect(() => {
    if (!open) {
      setSheetOpen(false)
      setResultOpen(false)
      setSession(null)
      setInitialValues(null)
      return
    }

    setSheetOpen(true)
    setResultOpen(false)
    setSession(null)
    setInitialValues(null)
  }, [open])

  const handleClose = () => {
    setSheetOpen(false)
    setResultOpen(false)
    setSession(null)
    setInitialValues(null)
    onClose()
  }

  const handleGenerateStart = (payload: CharacterAiImageGeneratePayload) => {
    setSheetOpen(false)
    setInitialValues(null)
    setSession(payload)
    setResultOpen(true)
  }

  const handleEditPrompt = (editSession: CharacterAiImageGeneratePayload) => {
    setResultOpen(false)
    setInitialValues(editSession)
    setSheetOpen(true)
  }

  const handleConfirm = (imageUrl: string) => {
    onConfirm(imageUrl)
    handleClose()
  }

  if (!open) return null

  // TODO: 接入 CharacterAiImageSheet 和 CharacterAiImageResultPage（阶段3 pages层迁移后补全）
  return null
}
