/** AI 生图表单：提示词 / 参考图 / 画风 三者至少填一项即可提交 */
export function canSubmitAiAppearanceForm(input: {
  prompt: string;
  styleKey: string;
  referenceImageUrl: string | null;
  referenceUploading?: boolean;
}): boolean {
  if (input.referenceUploading) return false;
  return (
    Boolean(input.prompt.trim()) ||
    Boolean(input.styleKey.trim()) ||
    Boolean(input.referenceImageUrl)
  );
}
