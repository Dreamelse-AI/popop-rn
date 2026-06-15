import { useState } from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BasicFieldCard, BasicSelectRow } from './form-field-row';
import { CharacterVoicePickerPage } from './character-voice-picker-page';

type CharacterVoiceFieldProps = {
  voiceId: string;
  voiceName: string;
  onChange: (patch: { voiceId: string; voiceName: string }) => void;
};

/** 角色音色选择（数据来自 /character/page_config voices） */
export function CharacterVoiceField({ voiceId, voiceName, onChange }: CharacterVoiceFieldProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const displayValue = voiceName || voiceId;

  return (
    <>
      <Pressable onPress={() => setOpen(true)}>
        <BasicFieldCard label={t('character.createPage.voice')}>
          <BasicSelectRow
            value={displayValue}
            placeholder={t('character.createPage.pleaseSelect')}
          />
        </BasicFieldCard>
      </Pressable>

      <CharacterVoicePickerPage
        open={open}
        value={voiceId}
        onClose={() => setOpen(false)}
        onSelect={(voice) =>
          onChange({
            voiceId: voice.voice_id?.trim() ?? '',
            voiceName: voice.voice_name?.trim() || voice.voice_id?.trim() || '',
          })
        }
      />
    </>
  );
}
