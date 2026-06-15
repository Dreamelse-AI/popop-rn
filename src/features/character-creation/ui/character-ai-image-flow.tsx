import { useEffect, useState } from 'react';

import type { GenerateAppearanceContext } from '@/features/character-creation/api/gen-appearance-api';
import {
  CharacterAiImageSheet,
  type CharacterAiImageGeneratePayload,
} from '@/pages/character-creation/edit/components/character-ai-image-sheet';
import { CharacterAiImageResultPage } from '@/pages/character-creation/edit/components/character-ai-image-result-page';

type CharacterAiImageFlowProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (imageUrl: string) => void;
  /** 生图上下文：创建/编辑传 draft，发布动态传 characterId */
  getGenerationContext: () => GenerateAppearanceContext;
};

/**
 * AI 生图完整流程：输入参数 Sheet → 生成结果页 → 确认回调。
 * 封装 CharacterAiImageSheet + CharacterAiImageResultPage，供发布动态、角色形象等场景复用。
 */
export function CharacterAiImageFlow({
  open,
  onClose,
  onConfirm,
  getGenerationContext,
}: CharacterAiImageFlowProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [session, setSession] = useState<CharacterAiImageGeneratePayload | null>(null);
  const [initialValues, setInitialValues] = useState<CharacterAiImageGeneratePayload | null>(null);

  useEffect(() => {
    if (!open) {
      setSheetOpen(false);
      setResultOpen(false);
      setSession(null);
      setInitialValues(null);
      return;
    }

    setSheetOpen(true);
    setResultOpen(false);
    setSession(null);
    setInitialValues(null);
  }, [open]);

  const handleClose = () => {
    setSheetOpen(false);
    setResultOpen(false);
    setSession(null);
    setInitialValues(null);
    onClose();
  };

  const handleGenerateStart = (payload: CharacterAiImageGeneratePayload) => {
    setSheetOpen(false);
    setInitialValues(null);
    setSession(payload);
    setResultOpen(true);
  };

  const handleEditPrompt = (editSession: CharacterAiImageGeneratePayload) => {
    setResultOpen(false);
    setInitialValues(editSession);
    setSheetOpen(true);
  };

  const handleConfirm = (imageUrl: string) => {
    onConfirm(imageUrl);
    handleClose();
  };

  if (!open) return null;

  return (
    <>
      <CharacterAiImageSheet
        open={sheetOpen}
        initialValues={initialValues}
        onClose={handleClose}
        onGenerate={handleGenerateStart}
      />

      <CharacterAiImageResultPage
        open={resultOpen}
        session={session}
        getGenerationContext={getGenerationContext}
        onClose={handleClose}
        onConfirm={handleConfirm}
        onEditPrompt={handleEditPrompt}
      />
    </>
  );
}
