import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  fetchGenderOptions,
  fetchPageConfigVoices,
  filterVoicesByGender,
  type GenderValue,
  type PageConfigSelectOption,
} from '@/features/character-creation/api/character-page-config-api';
import { AudioPreviewButton } from '@/features/resource/ui/audio-preview-button';
import type { CharacterVoice } from '@/generated/arca_apiComponents';
import { FullscreenPage, PageHeaderBar, BackButton } from '@/shared/ui/fullscreen-page';

type CharacterVoicePickerPageProps = {
  open: boolean;
  value: string;
  onClose: () => void;
  onSelect: (voice: CharacterVoice) => void;
};

function resolveVoiceId(voice: CharacterVoice): string {
  return voice.voice_id?.trim() ?? '';
}

function resolveVoiceLabel(voice: CharacterVoice): string {
  return voice.voice_name?.trim() || resolveVoiceId(voice) || '—';
}

/** 音色选择全屏页（数据来自 /character/page_config voices） */
export function CharacterVoicePickerPage({
  open,
  value,
  onClose,
  onSelect,
}: CharacterVoicePickerPageProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [genderTabs, setGenderTabs] = useState<PageConfigSelectOption<GenderValue>[]>([]);
  const [activeGender, setActiveGender] = useState<GenderValue>('male');
  const [voices, setVoices] = useState<CharacterVoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(false);

    void Promise.all([fetchGenderOptions(), fetchPageConfigVoices()])
      .then(([tabs, list]) => {
        if (cancelled) return;
        setGenderTabs(tabs);
        setActiveGender(tabs[0]?.value ?? 'male');
        setVoices(list);
      })
      .catch(() => {
        if (!cancelled) {
          setGenderTabs([]);
          setVoices([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const filteredVoices = useMemo(
    () => filterVoicesByGender(voices, activeGender),
    [activeGender, voices],
  );

  if (!open) return null;

  return (
    <FullscreenPage backgroundColor="#f7f7f7">
      <PageHeaderBar>
        <BackButton onPress={onClose} />
        <View style={styles.genderTabs}>
          {genderTabs.map((tab) => {
            const active = tab.value === activeGender;
            return (
              <Pressable
                key={tab.value}
                onPress={() => setActiveGender(tab.value)}
                style={styles.genderTab}
              >
                <Text style={[styles.genderTabText, active && styles.genderTabTextActive]}>
                  {tab.label}
                </Text>
                {active ? <View style={styles.genderTabIndicator} /> : null}
              </Pressable>
            );
          })}
        </View>
      </PageHeaderBar>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(16, insets.bottom) }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={styles.emptyText}>{t('character.creation.loading')}</Text>
        ) : error ? (
          <Text style={styles.emptyText}>{t('character.creation.loadFailed')}</Text>
        ) : filteredVoices.length === 0 ? (
          <Text style={styles.emptyText}>{t('character.createPage.voicePickerEmpty')}</Text>
        ) : (
          <View style={styles.voiceList}>
            {filteredVoices.map((voice) => {
              const voiceId = resolveVoiceId(voice);
              const isSelected = Boolean(value && voiceId === value);

              return (
                <Pressable
                  key={voiceId || resolveVoiceLabel(voice)}
                  onPress={() => {
                    onSelect(voice);
                    onClose();
                  }}
                  style={styles.voiceRow}
                >
                  <Text style={styles.voiceLabel} numberOfLines={1}>
                    {resolveVoiceLabel(voice)}
                  </Text>
                  {isSelected ? (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>
                        {t('character.createPage.voiceSelected')}
                      </Text>
                    </View>
                  ) : null}
                  <AudioPreviewButton url={voice.sample?.url} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </FullscreenPage>
  );
}

const styles = StyleSheet.create({
  genderTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  genderTab: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  genderTabText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
  },
  genderTabTextActive: {
    fontWeight: '700',
    color: '#000000',
  },
  genderTabIndicator: {
    marginTop: 4,
    height: 3,
    width: 32,
    borderRadius: 999,
    backgroundColor: '#000000',
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  emptyText: {
    paddingVertical: 64,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  voiceList: {
    flexDirection: 'column',
    gap: 8,
  },
  voiceRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  voiceLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    color: '#000000',
  },
  selectedBadge: {
    borderRadius: 999,
    backgroundColor: '#fdeab3',
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.7)',
  },
});
