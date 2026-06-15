import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DetailSettingOption } from '@/features/character-creation/api/character-page-config-api';
import { useCharacterDetailSettingOptions } from '@/features/character-creation/hooks/use-character-detail-setting-options';

import { CharacterDetailsEditSheet } from './character-details-edit-sheet';
import { CharacterDetailsListSheet } from './character-details-list-sheet';
import { PillInputRow } from './form-field-row';

type CharacterDetailsFieldProps = {
  value: Record<string, string>;
  onChange: (settings: Record<string, string>) => void;
};

export function CharacterDetailsField({ value, onChange }: CharacterDetailsFieldProps) {
  const { t } = useTranslation();
  const [listOpen, setListOpen] = useState(false);
  const [editOption, setEditOption] = useState<DetailSettingOption | null>(null);
  const { options, loading, addCustomCategory } = useCharacterDetailSettingOptions(listOpen);

  const displayOptions = useMemo(() => {
    const known = new Set(options.map((item) => item.key));
    const orphaned = Object.entries(value)
      .filter(([key, content]) => content.trim() && !known.has(key))
      .map(([key, content]) => ({
        key,
        emoji: '📝',
        label: key,
        maxLength: content.length > 10 ? 200 : 10,
      }));
    return [...options, ...orphaned];
  }, [options, value]);

  const filledCount = Object.values(value).filter((item) => item.trim()).length;
  const summary =
    filledCount > 0
      ? t('character.createPage.detailsFilledCount', { count: filledCount })
      : '';

  const updateSetting = (key: string, content: string) => {
    const next = { ...value };
    if (content) {
      next[key] = content;
    } else {
      delete next[key];
    }
    onChange(next);
  };

  const handleAddCustomCategory = (label: string) => {
    const created = addCustomCategory(label);
    if (!created) return null;
    return {
      key: created.key,
      emoji: created.emoji,
      label: created.label,
      maxLength: 10,
    } satisfies DetailSettingOption;
  };

  return (
    <>
      <PillInputRow
        value={summary}
        placeholder={t('character.createPage.otherSettingsPlaceholder')}
        readOnly
        onPress={() => setListOpen(true)}
        onAddPress={() => setListOpen(true)}
      />

      <CharacterDetailsListSheet
        open={listOpen}
        options={displayOptions}
        values={value}
        loading={loading}
        onClose={() => setListOpen(false)}
        onSelect={(option) => setEditOption(option)}
        onAddCustomCategory={handleAddCustomCategory}
      />

      <CharacterDetailsEditSheet
        open={editOption !== null}
        option={editOption}
        value={editOption ? (value[editOption.key] ?? '') : ''}
        onClose={() => setEditOption(null)}
        onConfirm={(content) => {
          if (!editOption) return;
          updateSetting(editOption.key, content);
        }}
        onDelete={() => {
          if (!editOption) return;
          updateSetting(editOption.key, '');
        }}
      />
    </>
  );
}
