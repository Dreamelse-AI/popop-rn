export function splitTextBubbles(text: string): string[] {
  return text
    .split('\n')
    .map(s => s.trimEnd())
    .filter(Boolean);
}
