import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { cdnImage } from '@/shared/lib/cdn'

const IconBack = cdnImage('assets/character/add-character/characterAddCreate-back.png')

type CharacterCreatePageProps = {
  onClose: () => void
}

export function CharacterCreatePage({ onClose }: CharacterCreatePageProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.backButton} accessibilityLabel="뒤로가기">
          <Image source={{ uri: IconBack }} style={{width: 36, height: 36}} />
        </Pressable>
        <Text style={styles.headerTitle}>캐릭터 생성</Text>
        <Pressable style={styles.saveButton}>
          <Text style={styles.saveText}>구하다</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholder}>Character Create Form</Text>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
  },
  saveButton: {
    borderRadius: 9999,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.3)',
  },
})
