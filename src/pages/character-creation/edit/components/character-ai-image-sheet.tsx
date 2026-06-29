import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { fetchAppearanceStyles } from '@/features/character-creation/api/appearance-styles-api';
import type { AppearanceStyleItem } from '@/features/character-creation/api/appearance-styles-api';
import { canSubmitAiAppearanceForm } from '@/features/character-creation/lib/ai-appearance-form';
import { uploadCharacterAppearanceImage } from '@/features/character-creation/lib/upload-character-image';
import { walletFreeQuotas } from '@/generated/arca_api';
import { resolveTosAssetUrl } from '@/features/chat/lib/tos-upload';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { SheetBody, SheetFooterButton, SheetHeader } from '@/shared/ui/sheet-primitives';

import { CharacterAppearanceStyleSheet } from './character-appearance-style-sheet';

export type CharacterAiImageGeneratePayload = {
  prompt: string;
  styleKey: string;
  referenceImageUrl: string | null;
};

type CharacterAiImageSheetProps = {
  open: boolean;
  initialValues?: CharacterAiImageGeneratePayload | null;
  onClose: () => void;
  onGenerate?: (payload: CharacterAiImageGeneratePayload) => void | Promise<void>;
};

export function CharacterAiImageSheet({
  open,
  initialValues = null,
  onClose,
  onGenerate,
}: CharacterAiImageSheetProps) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [styleKey, setStyleKey] = useState('');
  const [styles2, setStyles2] = useState<AppearanceStyleItem[]>([]);
  const [styleSheetOpen, setStyleSheetOpen] = useState(false);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [referenceUploading, setReferenceUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null);

  const selectedStyle = styleKey
    ? styles2.find((item) => item.style_key === styleKey)
    : undefined;

  useEffect(() => {
    if (!open) return;

    setPrompt(initialValues?.prompt ?? '');
    setStyleKey(initialValues?.styleKey ?? '');
    setReferenceImageUrl(initialValues?.referenceImageUrl ?? null);
    setReferencePreviewUrl(
      initialValues?.referenceImageUrl
        ? resolveTosAssetUrl(initialValues.referenceImageUrl)
        : null,
    );
    setReferenceUploading(false);
    setGenerating(false);
    setStyleSheetOpen(false);

    void fetchAppearanceStyles()
      .then((items) => {
        setStyles2(items);
        if (initialValues?.styleKey) {
          setStyleKey(initialValues.styleKey);
        }
      })
      .catch(() => {
        setStyles2([]);
      });

    void walletFreeQuotas()
      .then((resp) => {
        const quota = resp.free_quotas?.find(
          (item) => item.scene === 'gen_appearance' || item.scene === 'gen_image',
        );
        setFreeRemaining(quota?.remaining ?? null);
      })
      .catch(() => setFreeRemaining(null));
  }, [open, initialValues]);

  const handlePickReference = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    setReferencePreviewUrl(asset.uri);
    setReferenceUploading(true);

    try {
      const result = await uploadCharacterAppearanceImage(asset.uri);
      setReferenceImageUrl(result.url);
    } catch {
      setReferencePreviewUrl(null);
      setReferenceImageUrl(null);
    } finally {
      setReferenceUploading(false);
    }
  };

  const handleRemoveReference = () => {
    setReferencePreviewUrl(null);
    setReferenceImageUrl(null);
  };

  const handleGenerate = async () => {
    const payload = {
      prompt: prompt.trim(),
      styleKey: styleKey.trim(),
      referenceImageUrl,
    };

    if (!canSubmitAiAppearanceForm({ ...payload, referenceUploading }) || generating) return;

    setGenerating(true);
    try {
      await onGenerate?.(payload);
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = canSubmitAiAppearanceForm({
    prompt,
    styleKey,
    referenceImageUrl,
    referenceUploading,
  });

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        header={<SheetHeader title={t('character.createPage.imageAiTitle')} />}
        footer={
          <View style={styles.footerContainer}>
            <SheetFooterButton
              label={
                generating
                  ? t('character.createPage.imageAiGenerating')
                  : t('character.createPage.imageAiGenerate')
              }
              onPress={() => void handleGenerate()}
              disabled={!canGenerate || generating}
              loading={generating}
            />
            {freeRemaining !== null && (
              <Text style={styles.quotaText}>
                {t('character.createPage.imageAiFreeQuota', { count: freeRemaining })}
              </Text>
            )}
          </View>
        }
      >
        <SheetBody style={styles.content}>
          <View style={styles.promptCard}>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder={t('character.createPage.imageAiPromptPlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.3)"
              multiline
              numberOfLines={5}
              style={styles.promptInput}
            />

            <View style={styles.promptActions}>
              <View style={styles.referenceArea}>
                {referencePreviewUrl ? (
                  <View style={styles.referencePreview}>
                    <Image
                      source={{ uri: referencePreviewUrl }}
                      style={styles.referenceImage}
                      contentFit="cover"
                    />
                    {referenceUploading && (
                      <View style={styles.referenceOverlay}>
                        <Text style={styles.referenceOverlayText}>…</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={handleRemoveReference}
                      disabled={referenceUploading}
                      style={styles.referenceRemoveButton}
                      accessibilityLabel={t('character.createPage.imageDelete')}
                    >
                      <Text style={styles.referenceRemoveText}>×</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => void handlePickReference()}
                    disabled={referenceUploading}
                    style={styles.referenceAddButton}
                  >
                    <Text style={styles.referenceAddPlus}>+</Text>
                    <Text style={styles.referenceAddLabel}>
                      {t('character.createPage.imageAiReference')}
                    </Text>
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => setStyleSheetOpen(true)}
                style={styles.styleButton}
              >
                {selectedStyle?.style_icon ? (
                  <Image
                    source={{ uri: resolveTosAssetUrl(selectedStyle.style_icon.url) }}
                    style={styles.styleIcon}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.styleIconPlaceholder}>
                    <Text style={styles.styleIconPlaceholderText}>✦</Text>
                  </View>
                )}
                <Text style={styles.styleLabel} numberOfLines={1}>
                  {selectedStyle?.style_name ?? t('character.createPage.imageAiStyleSelect')}
                </Text>
              </Pressable>
            </View>
          </View>
        </SheetBody>
      </BottomSheet>

      <CharacterAppearanceStyleSheet
        open={styleSheetOpen}
        selectedStyleKey={styleKey}
        onClose={() => setStyleSheetOpen(false)}
        onConfirm={setStyleKey}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 4,
  },
  promptCard: {
    borderRadius: 20,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  promptInput: {
    minHeight: 120,
    width: '100%',
    fontSize: 16,
    color: '#000000',
    textAlignVertical: 'top',
  },
  promptActions: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  referenceArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  referencePreview: {
    position: 'relative',
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#efefef',
    overflow: 'hidden',
  },
  referenceImage: {
    width: '100%',
    height: '100%',
  },
  referenceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referenceOverlayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  referenceRemoveButton: {
    position: 'absolute',
    right: 2,
    top: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referenceRemoveText: {
    fontSize: 12,
    color: '#ffffff',
  },
  referenceAddButton: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 9999,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
  },
  referenceAddPlus: {
    fontSize: 16,
    lineHeight: 18,
    color: 'rgba(0,0,0,0.4)',
  },
  referenceAddLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  styleButton: {
    maxWidth: '55%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 9999,
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
  },
  styleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  styleIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ececec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleIconPlaceholderText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
  },
  styleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    flexShrink: 1,
  },
  footerContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  quotaText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
  },
});
