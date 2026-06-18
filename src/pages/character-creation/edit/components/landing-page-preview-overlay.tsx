import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { CharacterDetailHtmlView } from '@/pages/character/components/character-detail-html-view';
import { getCharacterFixedNavHeightPx } from '@/pages/character/components/character-fixed-nav-header';
import { FullscreenPage } from '@/shared/ui/fullscreen-page';

type LandingPagePreviewOverlayProps = {
  open: boolean;
  previewUrl: string | null;
  loading?: boolean;
  onClose: () => void;
};

function PreviewCloseIcon() {
  return (
    <Svg viewBox="0 0 36 36" width={36} height={36} fill="none">
      <Path
        d="M10 10l16 16M26 10 10 26"
        stroke="#ffffff"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Character creation landing page preview, backed by the same WebView as character detail. */
export function LandingPagePreviewOverlay({
  open,
  previewUrl,
  loading = false,
  onClose,
}: LandingPagePreviewOverlayProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navHeight = getCharacterFixedNavHeightPx(insets.top);

  if (!open) return null;

  return (
    <FullscreenPage backgroundColor="#000000" zIndex={90}>
      <View
        pointerEvents="box-none"
        style={[styles.closeHeader, { paddingTop: insets.top, height: navHeight }]}
      >
        <Pressable
          onPress={onClose}
          style={styles.closeButton}
          accessibilityLabel={t('character.detailPage.back')}
        >
          <PreviewCloseIcon />
        </Pressable>
      </View>

      <View style={styles.content}>
        {loading || !previewUrl ? (
          <View style={styles.center}>
            <Text style={styles.statusText}>
              {loading
                ? t('character.createPage.previewLoading')
                : t('character.createPage.previewFailed')}
            </Text>
          </View>
        ) : (
          <CharacterDetailHtmlView landingPageUrl={previewUrl} navHeight={navHeight} />
        )}
      </View>
    </FullscreenPage>
  );
}

const styles = StyleSheet.create({
  closeHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});
