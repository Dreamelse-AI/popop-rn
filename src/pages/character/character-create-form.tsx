import { useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native'
import { Image } from 'expo-image'

export type CharacterCreateTab = 'settings' | 'dynamic'

type CharacterCreateFormProps = {
  activeTab?: CharacterCreateTab
  onActiveTabChange?: (tab: CharacterCreateTab) => void
}

export function CharacterCreateForm({ activeTab = 'settings', onActiveTabChange }: CharacterCreateFormProps) {
  const [name, setName] = useState('')
  const [greeting, setGreeting] = useState('')
  const [personality, setPersonality] = useState('')

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Tab selector */}
      <View style={styles.tabBar}>
        <Pressable onPress={() => onActiveTabChange?.('settings')} style={[styles.tab, activeTab === 'settings' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>설정</Text>
        </Pressable>
        <Pressable onPress={() => onActiveTabChange?.('dynamic')} style={[styles.tab, activeTab === 'dynamic' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab === 'dynamic' && styles.tabTextActive]}>다이나믹</Text>
        </Pressable>
      </View>

      {activeTab === 'settings' ? (
        <View style={styles.formSection}>
          {/* Character image */}
          <View style={styles.imageSection}>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>+</Text>
            </View>
            <Text style={styles.imageHint}>캐릭터 이미지를 추가하세요</Text>
          </View>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>이름</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="캐릭터의 이름을 입력하세요"
              placeholderTextColor="rgba(0,0,0,0.3)"
              style={styles.input}
            />
          </View>

          {/* Greeting */}
          <View style={styles.field}>
            <Text style={styles.label}>인사말</Text>
            <TextInput
              value={greeting}
              onChangeText={setGreeting}
              placeholder="첫 인사말을 입력하세요"
              placeholderTextColor="rgba(0,0,0,0.3)"
              style={styles.textArea}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Personality */}
          <View style={styles.field}>
            <Text style={styles.label}>성격</Text>
            <TextInput
              value={personality}
              onChangeText={setPersonality}
              placeholder="캐릭터의 성격을 설명하세요"
              placeholderTextColor="rgba(0,0,0,0.3)"
              style={styles.textArea}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
      ) : (
        <View style={styles.dynamicSection}>
          <Text style={styles.dynamicPlaceholder}>Dynamic settings coming soon</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  tab: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.4)',
  },
  tabTextActive: {
    color: '#000000',
  },
  formSection: {
    gap: 24,
    paddingTop: 24,
  },
  imageSection: {
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 32,
    color: 'rgba(0,0,0,0.3)',
  },
  imageHint: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#000000',
  },
  textArea: {
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    textAlignVertical: 'top',
  },
  dynamicSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  dynamicPlaceholder: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
  },
})
