import { useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  useCharacterDraftForm,
  type FlushToServerResult,
} from '@/features/character-creation/hooks/use-character-draft-form';
import { useLandingPageBeautify } from '@/features/character-creation/hooks/use-landing-page-beautify';
import type { CharacterEditMode } from '@/features/character-creation/lib/character-edit-mode';
import { resolveDraftStorageId } from '@/features/character-creation/lib/draft-local-store';
import { submitCreateFormAndGoChat } from '@/features/character-creation/lib/submit-create-form-and-go-chat';
import { useSectionScrollSpy } from '@/features/character-creation/hooks/use-section-scroll-spy';
import type { CharacterDraftFormState, CreationFormSection } from '@/features/character-creation/types/form';
import { CREATION_FORM_SECTIONS } from '@/features/character-creation/types/form';

import { FormSectionNav } from './components/form-section-nav';
import {
  AppearanceSection,
  BasicInfoSection,
  BeautifySection,
  DetailsSection,
  OpeningSection,
} from './components/form-sections';
import { LandingPagePreviewOverlay } from './components/landing-page-preview-overlay';
import { SpinnerIcon } from '../components/creation-icons';

export type CharacterCreateFormProps = {
  draftId?: string;
  editMode?: CharacterEditMode;
  characterId?: string;
  onFormChange?: (form: CharacterDraftFormState | null) => void;
  onSavingChange?: (saving: boolean) => void;
  flushRef?: React.MutableRefObject<(() => Promise<FlushToServerResult>) | null>;
  goChatRef?: React.MutableRefObject<((signal?: AbortSignal) => Promise<string | null>) | null>;
  onGoChatReadyChange?: (ready: boolean) => void;
  previewRef?: React.MutableRefObject<(() => void) | null>;
  onPreviewLoadingChange?: (loading: boolean) => void;
  contentPaddingBottom?: number;
};

export function CharacterCreateForm({
  draftId,
  editMode = 'create',
  characterId,
  onFormChange,
  onSavingChange,
  flushRef,
  goChatRef,
  onGoChatReadyChange,
  previewRef,
  onPreviewLoadingChange,
  contentPaddingBottom = 40,
}: CharacterCreateFormProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const formRef = useRef<CharacterDraftFormState | null>(null);

  const { form, loading, saving, error, patchForm, flushToServer, reload } =
    useCharacterDraftForm(draftId, {
      editMode,
      characterId: editMode === 'character' ? characterId : undefined,
    });

  const storageId = resolveDraftStorageId(editMode, { draftId, characterId });
  const beautify = useLandingPageBeautify({
    form,
    patchForm,
    flushToServer,
    storageId,
    editMode,
    characterId,
  });

  const { activeSection, setSectionOffset, scrollToSection, handleScroll } = useSectionScrollSpy(
    scrollRef,
    CREATION_FORM_SECTIONS,
  );

  const setSectionRef = (key: CreationFormSection) => (node: View | null) => {
    if (node) {
      node.measureLayout(
        scrollRef.current as unknown as View,
        (_x, y) => {
          setSectionOffset(key, y);
        },
        () => {},
      );
    }
  };

  formRef.current = form;
  const goChatReady = Boolean(form) && !loading && !error;

  useEffect(() => {
    onFormChange?.(form);
  }, [form, onFormChange]);

  useEffect(() => {
    onGoChatReadyChange?.(goChatReady);
  }, [goChatReady, onGoChatReadyChange]);

  useEffect(() => {
    return () => {
      onGoChatReadyChange?.(false);
    };
  }, [onGoChatReadyChange]);

  useEffect(() => {
    onSavingChange?.(saving);
  }, [onSavingChange, saving]);

  useEffect(() => {
    onPreviewLoadingChange?.(beautify.previewLoading);
  }, [beautify.previewLoading, onPreviewLoadingChange]);

  useEffect(() => {
    if (!flushRef) return;
    flushRef.current = flushToServer;
    return () => {
      flushRef.current = null;
    };
  }, [flushRef, flushToServer]);

  useEffect(() => {
    if (!previewRef) return;
    previewRef.current = () => {
      void beautify.openPreview();
    };
    return () => {
      previewRef.current = null;
    };
  }, [beautify.openPreview, previewRef]);

  useEffect(() => {
    if (!goChatRef) return;
    if (!goChatReady) {
      goChatRef.current = null;
      return;
    }

    goChatRef.current = async (signal?: AbortSignal) => {
      const current = formRef.current;
      if (!current) return null;
      return submitCreateFormAndGoChat(current, signal);
    };
    return () => {
      goChatRef.current = null;
    };
  }, [goChatRef, goChatReady]);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{t('character.creation.loadFailed')}</Text>
        <Pressable
          onPress={() => void reload()}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>{t('character.creation.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  if (loading || !form) {
    return (
      <View style={styles.centerContainer}>
        <SpinnerIcon size={32} color="rgba(0,0,0,0.3)" />
        <Text style={styles.loadingText}>{t('character.creation.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          handleScroll(e.nativeEvent.contentOffset.y);
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.navWrapper}>
          <FormSectionNav activeSection={activeSection} onSelect={scrollToSection} />
        </View>

        <View style={[styles.sectionsContainer, { paddingBottom: contentPaddingBottom }]}>
          <BasicInfoSection form={form} setRef={setSectionRef('basic')} onChange={patchForm} />
          <AppearanceSection
            form={form}
            setRef={setSectionRef('appearance')}
            onChange={patchForm}
          />
          <OpeningSection form={form} setRef={setSectionRef('opening')} onChange={patchForm} />
          <DetailsSection form={form} setRef={setSectionRef('details')} onChange={patchForm} />
          <BeautifySection
            form={form}
            setRef={setSectionRef('beautify')}
            onChange={patchForm}
            generateState={beautify.generateState}
            onGenerate={beautify.handleGenerate}
            onRestoreDefault={beautify.handleRestoreDefault}
          />
        </View>
      </ScrollView>

      <LandingPagePreviewOverlay
        open={beautify.previewOpen}
        previewUrl={beautify.previewUrl}
        loading={beautify.previewLoading}
        onClose={beautify.closePreview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'column',
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
  },
  navWrapper: {
    paddingTop: 4,
    paddingBottom: 12,
    backgroundColor: '#f7f7f7',
    zIndex: 10,
  },
  sectionsContainer: {
    flexDirection: 'column',
    gap: 16,
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.7)',
  },
  retryButton: {
    borderRadius: 9999,
    backgroundColor: '#fdeab3',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
});
