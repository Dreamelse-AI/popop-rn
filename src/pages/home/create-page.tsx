import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation'
import { Image } from 'expo-image'

import LogoPopop from '@/shared/assets/feed/icon/Group 2117132529.svg'
import MascotEmpty from '@/shared/assets/character/add-character/characterAddCreate-defaultImage.svg'

type CreatePageProps = {
  hasCharacter: boolean
  onHasCharacterChange: (value: boolean) => void
}

export function CreatePage({ hasCharacter, onHasCharacterChange }: CreatePageProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LogoPopop width={190} height={30} />
      </View>

      {hasCharacter ? (
        <View style={styles.main}>
          <View style={styles.characterCard}>
            <View style={styles.cardOverlay} />
            <Text style={styles.cardName}>션 싱휘</Text>

            <View style={styles.cardBottomGradient}>
              <View style={styles.cardActions}>
                <Pressable style={styles.cardActionButton}>
                  <Text style={styles.cardActionText}>설정</Text>
                </Pressable>

                <View style={styles.cardDivider} />

                <Pressable style={styles.cardActionButton}>
                  <Text style={styles.cardActionText}>트동적</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Pressable
            style={styles.createNewCard}
            onPress={() => navigation.navigate('CharacterCreate')}
          >
            <View style={styles.plusIcon}>
              <View style={styles.plusVertical} />
              <View style={styles.plusHorizontal} />
            </View>
          </Pressable>
        </View>
      ) : (
        <View style={styles.emptyMain}>
          <MascotEmpty width={184} height={110} style={styles.mascot} />

          <Pressable
            style={styles.createButton}
            onPress={() => onHasCharacterChange(true)}
          >
            <Text style={styles.createButtonText}>만들다</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  characterCard: {
    height: 268,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
    backgroundColor: '#ccc',
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  cardName: {
    position: 'absolute',
    left: 12,
    top: 12,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 21,
    color: '#ffffff',
  },
  cardBottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 146,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cardActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cardActionText: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 21,
    color: '#ffffff',
  },
  cardDivider: {
    height: 20,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  createNewCard: {
    height: 268,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  plusVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 4,
    height: 40,
    marginLeft: -2,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  plusHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: 40,
    height: 4,
    marginTop: -2,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  emptyMain: {
    flex: 1,
    position: 'relative',
  },
  mascot: {
    position: 'absolute',
    left: '50%',
    top: 202,
    marginLeft: -92,
  },
  createButton: {
    position: 'absolute',
    left: '50%',
    top: 338,
    marginLeft: -60,
    borderRadius: 999,
    backgroundColor: '#fdeab3',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createButtonText: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 26,
    color: '#000000',
  },
})
