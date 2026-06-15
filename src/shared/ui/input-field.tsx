import { type ReactNode } from 'react'
import { View, TextInput, StyleSheet } from 'react-native'

type InputFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  leftSlot?: ReactNode
  rightSlot?: ReactNode
  error?: boolean
  disabled?: boolean
  autoFocus?: boolean
  secureTextEntry?: boolean
}

export function InputField({
  value,
  onChange,
  placeholder,
  maxLength,
  leftSlot,
  rightSlot,
  error = false,
  disabled = false,
  autoFocus = false,
  secureTextEntry = false,
}: InputFieldProps) {
  return (
    <View
      style={[
        styles.container,
        error && styles.containerError,
        disabled && styles.containerDisabled,
      ]}
    >
      {leftSlot && <View style={styles.slot}>{leftSlot}</View>}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(0,0,0,0.3)"
        maxLength={maxLength}
        editable={!disabled}
        autoFocus={autoFocus}
        secureTextEntry={secureTextEntry}
        style={styles.input}
      />
      {rightSlot && <View style={styles.slot}>{rightSlot}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  containerError: {
    borderColor: 'rgba(239,68,68,0.4)',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  slot: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: 'rgba(0,0,0,0.9)',
    padding: 0,
  },
})
