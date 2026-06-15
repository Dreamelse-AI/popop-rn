import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import {
  generateAppearanceImage,
  type GenerateAppearanceContext,
  type GenerateAppearanceParams,
} from '@/features/character-creation/api/gen-appearance-api';
import { AsyncTaskPollError } from '@/features/character-creation/lib/poll-async-task';
import { resolveTosAssetUrl } from '@/features/chat/lib/tos-upload';
import { randomUUID } from '@/shared/lib/random-uuid';
import { showGlobalToast } from '@/shared/wallet';

import { AiGeneratingSparkles } from './ai-generating-sparkles';
import type { CharacterAiImageGeneratePayload } from './character-ai-image-sheet';

export type AiGeneratedImageItem = {
  id: string;
  status: 'loading' | 'ready' | 'failed';
  imageUrl?: string;
  errorMessage?: string;
};

type CharacterAiImageResultPageProps = {
  open: boolean;
  session: CharacterAiImageGeneratePayload | null;
  getGenerationContext: () => GenerateAppearanceContext;
  onClose: () => void;
  onConfirm: (imageUrl: string) => void;
  onEditPrompt: (session: CharacterAiImageGeneratePayload) => void;
};

export function CharacterAiImageResultPage({
  open,
  session,
  getGenerationContext,
  onClose,
  onConfirm,
  onEditPrompt,
}: CharacterAiImageResultPageProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef(session);
  const initializedKeyRef = useRef<string | null>(null);
  const [items, setItems] = useState<AiGeneratedImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generatingMore, setGeneratingMore] = useState(false);

  sessionRef.current = session;

  const startGeneration = useCallback(async (
    params: Omit<GenerateAppearanceParams, 'context'>,
    itemId: string,
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await generateAppearanceImage(
        { ...params, context: getGenerationContext() },
        controller.signal,
      );
      if (!resp?.image?.url) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  status: 'failed' as const,
                  errorMessage: t('character.createPage.imageAiResultFailed'),
                }
              : item,
          ),
        );
        return;
      }

      const imageUrl = resp.image.url;
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: 'ready' as const, imageUrl } : item,
        ),
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;

      const message =
        error instanceof AsyncTaskPollError
          ? error.message
          : t('character.createPage.imageAiResultFailed');

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: 'failed' as const, errorMessage: message } : item,
        ),
      );
      showGlobalToast(message);
    }
  }, [getGenerationContext, t]);

  const appendGeneration = useCallback(
    (params: Omit<GenerateAppearanceParams, 'context'>) => {
      const itemId = randomUUID();
      setItems((prev) => [...prev, { id: itemId, status: 'loading' }]);
      setSelectedId(itemId);
      void startGeneration(params, itemId);
      return itemId;
    },
    [startGeneration],
  );

  useEffect(() => {
    if (!open || !session) {
      initializedKeyRef.current = null;
      return;
    }

    const sessionKey = `${session.prompt}::${session.styleKey}::${session.referenceImageUrl ?? ''}`;
    if (initializedKeyRef.current === sessionKey) return;
    initializedKeyRef.current = sessionKey;

    setItems([]);
    setSelectedId(null);
    setGeneratingMore(false);

    const itemId = randomUUID();
    setItems([{ id: itemId, status: 'loading' }]);
    setSelectedId(itemId);
    void startGeneration(
      {
        prompt: session.prompt,
        styleKey: session.styleKey,
        referenceImageUrl: session.referenceImageUrl,
      },
      itemId,
    );

    return () => {
      abortRef.current?.abort();
    };
  }, [open, session, startGeneration]);

  if (!open || !session) return null;

  const selectedItem = items.find((item) => item.id === selectedId) ?? items[items.length - 1];
  const canConfirm = selectedItem?.status === 'ready' && Boolean(selectedItem.imageUrl);
  const isLoading = selectedItem?.status === 'loading';

  const handleGenerateMore = async () => {
    if (generatingMore || !sessionRef.current) return;
    setGeneratingMore(true);
    try {
      appendGeneration({
        prompt: sessionRef.current.prompt,
        styleKey: sessionRef.current.styleKey,
        referenceImageUrl: sessionRef.current.referenceImageUrl,
      });
    } finally {
      setGeneratingMore(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedItem?.imageUrl) return;
    onConfirm(selectedItem.imageUrl);
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel={t('character.detailPage.back')}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </Pressable>
        </View>

        <View style={styles.contentArea}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <AiGeneratingSparkles />
              <Text style={styles.loadingText}>
                {t('character.createPage.imageAiResultGenerating')}
              </Text>
            </View>
          ) : selectedItem?.status === 'ready' && selectedItem.imageUrl ? (
            <Image
              source={{ uri: resolveTosAssetUrl(selectedItem.imageUrl) }}
              style={styles.resultImage}
              contentFit="contain"
            />
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {selectedItem?.errorMessage ?? t('character.createPage.imageAiResultFailed')}
              </Text>
              <Pressable
                onPress={() => void handleGenerateMore()}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>
                  {t('character.createPage.imageAiResultRetry')}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={[styles.bottomArea, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <Pressable
            onPress={() => onEditPrompt(session)}
            style={styles.promptRow}
          >
            <Text style={styles.promptSparkle}>✦</Text>
            <Text style={styles.promptText} numberOfLines={1}>{session.prompt}</Text>
          </Pressable>

          <View style={styles.thumbnailRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailList}
              style={styles.thumbnailScroll}
            >
              {items.map((item) => {
                const selected = item.id === selectedId;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedId(item.id)}
                    style={[
                      styles.thumbnail,
                      selected ? styles.thumbnailSelected : styles.thumbnailDefault,
                    ]}
                  >
                    {item.status === 'loading' ? (
                      <View style={styles.thumbnailLoading}>
                        <AiGeneratingSparkles scale={0.75} />
                      </View>
                    ) : item.status === 'ready' && item.imageUrl ? (
                      <Image
                        source={{ uri: resolveTosAssetUrl(item.imageUrl) }}
                        style={styles.thumbnailImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.thumbnailError}>
                        <Text style={styles.thumbnailErrorText}>!</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => void handleGenerateMore()}
                disabled={generatingMore}
                style={[
                  styles.thumbnailAdd,
                  generatingMore ? styles.thumbnailAddDisabled : undefined,
                ]}
                accessibilityLabel={t('character.createPage.imageAiGenerate')}
              >
                <Text style={styles.thumbnailAddText}>+</Text>
              </Pressable>
            </ScrollView>

            <Pressable
              disabled={!canConfirm}
              onPress={handleConfirm}
              style={[
                styles.confirmButton,
                !canConfirm ? styles.confirmButtonDisabled : undefined,
              ]}
            >
              <Text style={styles.confirmButtonText}>
                {t('character.createPage.imageAiResultConfirm')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    flexDirection: 'column',
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.8)',
  },
  contentArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  resultImage: {
    width: '100%',
    maxWidth: 360,
    height: '62%',
    borderRadius: 20,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  bottomArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  promptSparkle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  promptText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  thumbnailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnailScroll: {
    flex: 1,
    minWidth: 0,
  },
  thumbnailList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  thumbnailSelected: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  thumbnailDefault: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  thumbnailLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailErrorText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  thumbnailAdd: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailAddDisabled: {
    opacity: 0.5,
  },
  thumbnailAddText: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.4)',
  },
  confirmButton: {
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
});
