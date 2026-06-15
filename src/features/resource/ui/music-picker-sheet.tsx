import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MusicInfo } from '../music-list-api';
import { dialogPageStyleSettingsAssets } from '@/shared/assets/dialog/dialog-page-style-settings';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import { PopIcon } from '@/shared/ui/pop-icon';

import { fetchMusicList } from '../music-list-api';
import { AudioPreviewButton } from './audio-preview-button';

type MusicPickerSheetProps = {
  open: boolean;
  value: string | null;
  onClose: () => void;
  onSelect: (music: MusicInfo) => void;
  onClear?: () => void;
};

/** 音乐选择弹窗（调用 /resource/music_list） */
export function MusicPickerSheet({
  open,
  value,
  onClose,
  onSelect,
  onClear,
}: MusicPickerSheetProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<MusicInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(false);

    void fetchMusicList(true)
      .then(list => {
        if (!cancelled) setItems(list);
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
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

  const selected = items.find(item => item.music_key === value);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      closeIcon={<PopIcon icon={dialogPageStyleSettingsAssets.close} size={28} />}
      header={
        <View style={styles.header}>
          <Text style={styles.title}>{t('character.creation.musicPickerTitle')}</Text>
          {selected && onClear ? (
            <Pressable
              onPress={() => {
                onClear();
                onClose();
              }}
            >
              <Text style={styles.clearText}>{t('character.creation.musicPickerClear')}</Text>
            </Pressable>
          ) : null}
        </View>
      }
    >
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {loading ? (
          <Text style={styles.hint}>{t('character.creation.loading')}</Text>
        ) : error ? (
          <Text style={styles.hint}>{t('character.creation.loadFailed')}</Text>
        ) : items.length === 0 ? (
          <Text style={styles.hint}>{t('character.creation.musicPickerEmpty')}</Text>
        ) : (
          items.map(item => {
            const isSelected = item.music_key === value;
            const title = item.title?.trim() || item.music_key;

            return (
              <Pressable
                key={item.music_key}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                style={styles.row}
              >
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {title}
                </Text>
                {isSelected ? (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>
                      {t('character.createPage.voiceSelected')}
                    </Text>
                  </View>
                ) : null}
                <AudioPreviewButton url={item.media?.url} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  clearText: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  list: {
    maxHeight: 360,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 8,
  },
  hint: {
    paddingVertical: 32,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  rowTitle: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  selectedBadge: {
    borderRadius: 999,
    backgroundColor: '#fdeab3',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.7)',
  },
});
