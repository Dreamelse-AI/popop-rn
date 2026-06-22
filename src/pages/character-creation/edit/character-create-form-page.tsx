import { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import { resolveCharacterEditMode } from '@/features/character-creation/lib/character-edit-mode';
import type { FlushToServerResult } from '@/features/character-creation/hooks/use-character-draft-form';
import type { CharacterDraftFormState } from '@/features/character-creation/types/form';

import { CharacterCreateForm } from './character-create-form';
import { LandingPagePreviewHeaderButton } from './components/landing-page-preview-header-button';

type CharacterCreateFormPageProps = {
  draftId?: string;
};

export function CharacterCreateFormPage({ draftId }: CharacterCreateFormPageProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const params = (route.params ?? {}) as Record<string, string | undefined>;
  const characterId = params.characterId;
  const editMode = resolveCharacterEditMode({
    draftId,
    mode: params.mode,
    characterId,
  });
  const flushRef = useRef<(() => Promise<FlushToServerResult>) | null>(null);
  const previewRef = useRef<(() => void) | null>(null);
  const [form, setForm] = useState<CharacterDraftFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleBack = useCallback(async () => {
    if (flushRef.current) {
      await flushRef.current();
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const pageTitle = form?.name.trim() || t('character.creation.unnamed');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => void handleBack()}
          disabled={saving}
          style={[styles.backButton, saving ? styles.backButtonDisabled : undefined]}
          accessibilityLabel={t('character.detailPage.back')}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.pageTitle} numberOfLines={1}>{pageTitle}</Text>
        <View style={styles.headerRight}>
          {saving && (
            <Text style={styles.savingText}>
              {t('character.createPage.save')}…
            </Text>
          )}
          <LandingPagePreviewHeaderButton
            onPress={() => previewRef.current?.()}
            loading={previewLoading}
          />
        </View>
      </View>

      <CharacterCreateForm
        draftId={draftId}
        editMode={editMode}
        characterId={characterId}
        flushRef={flushRef}
        previewRef={previewRef}
        onPreviewLoadingChange={setPreviewLoading}
        onFormChange={setForm}
        onSavingChange={setSaving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    flexDirection: 'column',
  },
  header: {
    position: 'relative',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonDisabled: {
    opacity: 0.5,
  },
  backButtonText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000000',
    marginTop: -2,
  },
  pageTitle: {
    maxWidth: '60%',
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
  },
  headerRight: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
  },
});
