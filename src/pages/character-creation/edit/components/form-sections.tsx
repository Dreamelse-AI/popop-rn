import { useRef, useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AppearanceStyleItem } from '@/generated/arca_apiComponents';
import { fetchLandingPageStyles } from '@/features/character-creation/api/landing-page-styles-api';
import type { LandingPageGenerateState } from '@/features/character-creation/hooks/use-landing-page-beautify';
import type { CharacterDraftFormState } from '@/features/character-creation/types/form';
import { draftStateToApiForm } from '@/features/character-creation/lib/form-mapper';
import { useCharacterPageConfig } from '@/features/character-creation/hooks/use-character-page-config';
import { PopImage } from '@/shared/ui/pop-image';
import { BasicSelectDropdownField } from './basic-select-dropdown-field';
import { VisibilitySelectField } from './visibility-select-field';

import { CharacterAnonymousTagsField } from './character-anonymous-tags-field';
import { CharacterAppearanceField } from './character-appearance-field';
import { CharacterDetailsField } from './character-details-field';
import { CharacterTagsField } from './character-tags-field';
import { CharacterVoiceField } from './character-voice-field';
import { OpeningPrologueField } from './opening-prologue-field';
import {
  BasicFieldCard,
  BasicTextInput,
  BeautifyPromptInput,
  FormAnchorSection,
  ChevronRight,
  FormSectionCard,
  FormSectionTitle,
  ModuleSectionTitle,
} from './form-field-row';
import { SpinnerIcon } from '../../components/creation-icons';

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
      <BasicFieldCard label={t('character.createPage.name')} required>
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
            required
          />
        </View>
        <View style={styles.column}>
          <BasicSelectDropdownField
            label={t('character.createPage.gender')}
            value={form.gender}
            options={genderOptions}
            placeholder={t('character.createPage.pleaseSelect')}
            onChange={(gender) => onChange({ gender })}
            required
          />
        </View>
      </View>

      <CharacterVoiceField
        voiceId={form.voiceId}
        voiceName={form.voiceName}
        onChange={({ voiceId, voiceName }) => onChange({ voiceId, voiceName })}
      />

      <BasicFieldCard label={t('character.createPage.introduction')} required>
        <BasicTextInput
          value={form.profile}
          placeholder={t('character.createPage.introductionPlaceholder')}
          onChange={(profile) => onChange({ profile })}
          multiline
        />
      </BasicFieldCard>

      <BasicFieldCard label={t('character.createPage.personality')} required>
        <BasicTextInput
          value={form.disposition}
          placeholder={t('character.createPage.personalityPlaceholder')}
          onChange={(disposition) => onChange({ disposition })}
          multiline
        />
      </BasicFieldCard>

      <CharacterAnonymousTagsField
        value={form.anonymousTags}
        onChange={(anonymousTags) => onChange({ anonymousTags })}
      />

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
        <FormSectionTitle style={styles.noMarginBottom} required>
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
  form: CharacterDraftFormState;
  setRef: (node: View | null) => void;
  onChange: (patch: Partial<CharacterDraftFormState>) => void;
  generateState: LandingPageGenerateState;
  onGenerate: () => void;
  onRestoreDefault: () => void;
};

export function BeautifySection({
  form,
  setRef,
  onChange,
  generateState,
  onGenerate,
  onRestoreDefault,
}: BeautifySectionProps) {
  const { t } = useTranslation();
  const [stylesList, setStylesList] = useState<AppearanceStyleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const defaultStyleAppliedRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    void fetchLandingPageStyles()
      .then(setStylesList)
      .catch((error) => {
        console.warn('[BeautifySection] landing_page_styles failed:', error);
        setStylesList([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (form.landingPageStyleKey || stylesList.length === 0 || defaultStyleAppliedRef.current) return;
    defaultStyleAppliedRef.current = true;
    onChange({ landingPageStyleKey: stylesList[0]!.style_key });
  }, [form.landingPageStyleKey, onChange, stylesList]);

  const selectedStyleKey = form.landingPageStyleKey;
  const isGenerating = generateState === 'generating';
  const canGenerate = Boolean(selectedStyleKey.trim()) && !isGenerating;
  const generateLabel =
    generateState === 'generating'
      ? t('character.createPage.beautifyGenerating')
      : generateState === 'regenerate'
        ? t('character.createPage.beautifyRegenerate')
        : t('character.createPage.beautifyGenerate');

  return (
    <FormSectionCard
      id="section-beautify"
      sectionKey="beautify"
      setRef={setRef}
      backgroundColor="#fff6dd"
    >
      <ModuleSectionTitle
        emoji="🎨"
        title={t('character.createPage.beautifyPageTitle')}
        trailing={
          <Pressable
            onPress={onRestoreDefault}
            disabled={isGenerating}
            style={isGenerating ? styles.disabled : undefined}
          >
            <Text style={styles.restoreDefaultText}>
              {t('character.createPage.beautifyRestoreDefault')}
            </Text>
          </Pressable>
        }
      />

      <View style={styles.beautifyGrid}>
        {loading && stylesList.length === 0
          ? Array.from({ length: 4 }).map((_, index) => (
              <View
                key={index}
                style={styles.beautifyPlaceholder}
              />
            ))
          : stylesList.map((style) => {
              const selected = selectedStyleKey === style.style_key;
              return (
                <Pressable
                  key={style.style_key}
                  onPress={() => onChange({ landingPageStyleKey: style.style_key })}
                  disabled={isGenerating}
                  style={[
                    styles.beautifyStyleCard,
                    selected ? styles.beautifyStyleCardSelected : undefined,
                    isGenerating ? styles.disabled : undefined,
                  ]}
                >
                  <View style={styles.beautifyStyleImageWrap}>
                    <PopImage
                      uri={style.style_icon.url}
                      contentFit="cover"
                      style={styles.beautifyStyleImage}
                      accessibilityLabel={style.style_name}
                    />
                  </View>
                  <Text style={styles.beautifyStyleName} numberOfLines={1}>
                    {style.style_name}
                  </Text>
                </Pressable>
              );
            })}
      </View>

      <BeautifyPromptInput
        value={form.landingPagePrompt}
        placeholder={t('character.createPage.beautifyPlaceholder')}
        onChange={(landingPagePrompt) => onChange({ landingPagePrompt })}
      />

      <Pressable
        onPress={() => void onGenerate()}
        disabled={!canGenerate}
        style={[
          styles.generateButton,
          !canGenerate ? styles.disabled : undefined,
        ]}
      >
        {isGenerating ? (
          <SpinnerIcon size={16} color="rgba(0,0,0,0.3)" />
        ) : (
          <Text style={styles.previewSparkle}>✦</Text>
        )}
        <Text style={styles.previewButtonText}>
          {generateLabel}
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
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  beautifyPlaceholder: {
    width: '23%',
    aspectRatio: 3 / 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  beautifyStyleCard: {
    width: '23%',
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  beautifyStyleCardSelected: {
    borderColor: '#000000',
  },
  beautifyStyleImageWrap: {
    aspectRatio: 3 / 5,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  beautifyStyleImage: {
    width: '100%',
    height: '100%',
  },
  beautifyStyleName: {
    paddingHorizontal: 2,
    paddingTop: 6,
    paddingBottom: 2,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    color: 'rgba(0,0,0,0.7)',
  },
  restoreDefaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.4)',
  },
  disabled: {
    opacity: 0.5,
  },
  generateButton: {
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
