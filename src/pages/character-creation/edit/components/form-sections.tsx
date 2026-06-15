import { useRef, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { CharacterDraftFormState } from '@/features/character-creation/types/form';
import { draftStateToApiForm } from '@/features/character-creation/lib/form-mapper';
import { useCharacterPageConfig } from '@/features/character-creation/hooks/use-character-page-config';
import { BasicSelectDropdownField } from './basic-select-dropdown-field';
import { VisibilitySelectField } from './visibility-select-field';

import { CharacterAppearanceField } from './character-appearance-field';
import { CharacterDetailsField } from './character-details-field';
import { CharacterTagsField } from './character-tags-field';
import { CharacterVoiceField } from './character-voice-field';
import { OpeningPrologueField } from './opening-prologue-field';
import {
  BasicFieldCard,
  BasicSelectRow,
  BasicTextInput,
  FormAnchorSection,
  ChevronRight,
  FormSectionCard,
  FormSectionTitle,
  ModulePlainInput,
  ModuleSectionTitle,
} from './form-field-row';

type BasicInfoSectionProps = {
  form: CharacterDraftFormState;
  setRef: (node: View | null) => void;
  onChange: (patch: Partial<CharacterDraftFormState>) => void;
};

export function BasicInfoSection({ form, setRef, onChange }: BasicInfoSectionProps) {
  const { t } = useTranslation();
  const { genderOptions, speciesOptions, visibilityOptions } = useCharacterPageConfig(true);

  return (
    <FormAnchorSection id="section-basic" sectionKey="basic" setRef={setRef}>
      <BasicFieldCard label={t('character.createPage.name')}>
        <BasicTextInput
          value={form.name}
          placeholder={t('character.createPage.namePlaceholder')}
          onChange={(name) => onChange({ name })}
        />
      </BasicFieldCard>

      <CharacterTagsField
        value={form.tags}
        onChange={(tags) => onChange({ tags })}
      />

      <View style={styles.twoColumns}>
        <View style={styles.column}>
          <BasicSelectDropdownField
            label={t('character.createPage.species')}
            value={form.species}
            options={speciesOptions}
            placeholder={t('character.createPage.pleaseSelect')}
            onChange={(species) => onChange({ species })}
          />
        </View>
        <View style={styles.column}>
          <BasicSelectDropdownField
            label={t('character.createPage.gender')}
            value={form.gender}
            options={genderOptions}
            placeholder={t('character.createPage.pleaseSelect')}
            onChange={(gender) => onChange({ gender })}
          />
        </View>
      </View>

      <CharacterVoiceField
        voiceId={form.voiceId}
        voiceName={form.voiceName}
        onChange={({ voiceId, voiceName }) => onChange({ voiceId, voiceName })}
      />

      <BasicFieldCard label={t('character.createPage.introduction')}>
        <BasicTextInput
          value={form.profile}
          placeholder={t('character.createPage.introductionPlaceholder')}
          onChange={(profile) => onChange({ profile })}
          multiline
        />
      </BasicFieldCard>

      <BasicFieldCard label={t('character.createPage.personality')}>
        <BasicTextInput
          value={form.disposition}
          placeholder={t('character.createPage.personalityPlaceholder')}
          onChange={(disposition) => onChange({ disposition })}
          multiline
        />
      </BasicFieldCard>

      <BasicFieldCard label={t('character.createPage.anonymousTag')}>
        <View style={styles.anonymousInputRow}>
          <TextInput
            value={form.anonymousTags[0] ?? ''}
            placeholder={t('character.createPage.anonymousTagPlaceholder')}
            placeholderTextColor="rgba(0,0,0,0.3)"
            onChangeText={(text) => onChange({ anonymousTags: text ? [text] : [] })}
            style={styles.anonymousInput}
          />
          <View style={styles.anonymousAddButton}>
            <Text style={styles.anonymousAddButtonText}>+</Text>
          </View>
        </View>
      </BasicFieldCard>

      <VisibilitySelectField
        value={form.visibility}
        options={visibilityOptions}
        onChange={(visibility) => onChange({ visibility })}
      />
    </FormAnchorSection>
  );
}

type AppearanceSectionProps = {
  form: CharacterDraftFormState;
  setRef: (node: View | null) => void;
  onChange: (patch: Partial<CharacterDraftFormState>) => void;
};

export function AppearanceSection({ form, setRef, onChange }: AppearanceSectionProps) {
  const { t } = useTranslation();
  const count = form.images.length;
  const openGalleryRef = useRef<(() => void) | null>(null);
  const formRef = useRef(form);
  formRef.current = form;

  const getGenerationContext = useCallback(
    () => ({
      mode: 'draft' as const,
      draft: draftStateToApiForm(formRef.current),
      scene: formRef.current.targetCharacterId ? 'update_appearance' as const : 'create_character' as const,
    }),
    [],
  );

  return (
    <FormSectionCard id="section-appearance" sectionKey="appearance" setRef={setRef}>
      <View style={styles.appearanceHeader}>
        <FormSectionTitle style={styles.noMarginBottom}>
          {t('character.createPage.appearanceTitle')}
        </FormSectionTitle>
        {count > 0 && (
          <Pressable
            onPress={() => openGalleryRef.current?.()}
            style={styles.galleryCountButton}
          >
            <Text style={styles.galleryCountText}>{count}</Text>
            <ChevronRight size={14} color="rgba(0,0,0,0.3)" />
          </Pressable>
        )}
      </View>

      <Text style={styles.appearanceHint}>
        {t('character.createPage.appearanceHint')}
      </Text>

      <CharacterAppearanceField
        images={form.images}
        draftId={form.draftId}
        getGenerationContext={getGenerationContext}
        onChange={(images) => onChange({ images })}
        onGalleryTriggerReady={(openGallery) => {
          openGalleryRef.current = openGallery;
        }}
      />
    </FormSectionCard>
  );
}

type OpeningSectionProps = {
  form: CharacterDraftFormState;
  setRef: (node: View | null) => void;
  onChange: (patch: Partial<CharacterDraftFormState>) => void;
};

export function OpeningSection({ form, setRef, onChange }: OpeningSectionProps) {
  const { t } = useTranslation();

  return (
    <FormSectionCard
      id="section-opening"
      sectionKey="opening"
      setRef={setRef}
      backgroundColor="#e8f3ff"
    >
      <ModuleSectionTitle emoji="💬" title={t('character.createPage.openingLineTitle')} />

      <OpeningPrologueField
        value={form.openingPrologue}
        onChange={(openingPrologue) => onChange({ openingPrologue })}
      />
    </FormSectionCard>
  );
}

type DetailsSectionProps = {
  form: CharacterDraftFormState;
  setRef: (node: View | null) => void;
  onChange: (patch: Partial<CharacterDraftFormState>) => void;
};

export function DetailsSection({ form, setRef, onChange }: DetailsSectionProps) {
  const { t } = useTranslation();

  return (
    <FormSectionCard
      id="section-details"
      sectionKey="details"
      setRef={setRef}
      backgroundColor="#f0f0f0"
    >
      <ModuleSectionTitle emoji="📓" title={t('character.createPage.moreDetailsTitle')} />

      <CharacterDetailsField
        value={form.customizedSettings}
        onChange={(customizedSettings) => onChange({ customizedSettings })}
      />
    </FormSectionCard>
  );
}

type BeautifySectionProps = {
  setRef: (node: View | null) => void;
};

export function BeautifySection({ setRef }: BeautifySectionProps) {
  const { t } = useTranslation();

  return (
    <FormSectionCard
      id="section-beautify"
      sectionKey="beautify"
      setRef={setRef}
      backgroundColor="#fff6dd"
    >
      <ModuleSectionTitle emoji="🎨" title={t('character.createPage.beautifyPageTitle')} />

      <View style={styles.beautifyGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View
            key={index}
            style={styles.beautifyPlaceholder}
          />
        ))}
      </View>

      <ModulePlainInput
        value=""
        placeholder={t('character.createPage.beautifyPlaceholder')}
        onChange={() => {
          /* 介绍页美化逻辑后续接入 */
        }}
      />

      <Pressable style={styles.previewButton}>
        <Text style={styles.previewSparkle}>✦</Text>
        <Text style={styles.previewButtonText}>
          {t('character.createPage.preview')}
        </Text>
      </Pressable>
    </FormSectionCard>
  );
}

const styles = StyleSheet.create({
  twoColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  anonymousInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  anonymousInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    color: '#000000',
  },
  anonymousAddButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonymousAddButtonText: {
    fontSize: 16,
    lineHeight: 18,
    color: 'rgba(0,0,0,0.35)',
  },
  appearanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noMarginBottom: {
    marginBottom: 0,
  },
  galleryCountButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  galleryCountText: {
    fontSize: 12,
    lineHeight: 14,
    color: 'rgba(0,0,0,0.3)',
  },
  appearanceHint: {
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(0,0,0,0.35)',
    marginBottom: 12,
  },
  beautifyGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  beautifyPlaceholder: {
    flex: 1,
    aspectRatio: 3 / 5,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
  },
  previewSparkle: {
    fontSize: 16,
    lineHeight: 18,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
});
