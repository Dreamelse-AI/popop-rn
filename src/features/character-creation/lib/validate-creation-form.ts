import type { CharacterDraftFormState } from '../types/form';

/**
 * Validates the required fields of the character creation form.
 * Returns the i18n key of the first missing required field, or null if valid.
 */
export function validateCreationForm(form: CharacterDraftFormState): string | null {
  if (!form.name.trim()) return 'character.creation.validation.nameRequired';
  if (form.tags.length === 0) return 'character.creation.validation.tagsRequired';
  if (!form.species) return 'character.creation.validation.speciesRequired';
  if (!form.gender) return 'character.creation.validation.genderRequired';
  if (!form.voiceId) return 'character.creation.validation.voiceRequired';
  if (!form.profile.trim()) return 'character.creation.validation.introductionRequired';
  if (!form.disposition.trim()) return 'character.creation.validation.personalityRequired';
  return null;
}
