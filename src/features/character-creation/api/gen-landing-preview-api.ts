import { genLandingPreview } from '@/generated/arca_api'
import type { CharacterCreateForm } from '@/generated/arca_apiComponents'

export async function fetchLandingPagePreviewUrl(
  characterCreateForm: CharacterCreateForm,
): Promise<string> {
  const resp = await genLandingPreview({ character_create_form: characterCreateForm })

  const url = resp.preview_url?.trim()
  if (!url) {
    throw new Error('gen_landing_preview returned empty preview_url')
  }

  return url
}
