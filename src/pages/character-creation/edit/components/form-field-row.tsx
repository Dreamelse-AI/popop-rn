import type { ReactNode } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type FormFieldRowProps = {
  label: string;
  children: ReactNode;
  onPress?: () => void;
};

export function FormFieldRow({ label, children, onPress }: FormFieldRowProps) {
  const Container = onPress ? Pressable : View;
  return (
    <Container
      onPress={onPress}
      style={styles.fieldRow}
    >
      <Text style={styles.fieldRowLabel}>{label}</Text>
      {children}
    </Container>
  );
}

type FormTextInputProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  multiline?: boolean;
};

export function FormTextInput({ value, placeholder, onChange, multiline }: FormTextInputProps) {
  return (
    <TextInput
      value={value}
      placeholder={placeholder}
      placeholderTextColor="rgba(0,0,0,0.3)"
      onChangeText={onChange}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      style={[
        styles.textInput,
        multiline ? styles.textInputMultiline : undefined,
      ]}
    />
  );
}

type FormSelectValueProps = {
  value: string;
  placeholder: string;
  onPress?: () => void;
};

export function FormSelectValue({ value, placeholder, onPress }: FormSelectValueProps) {
  return (
    <Pressable style={styles.selectValue} onPress={onPress}>
      <Text
        style={[
          styles.selectValueText,
          !value ? styles.selectValuePlaceholder : undefined,
        ]}
        numberOfLines={1}
      >
        {value || placeholder}
      </Text>
      <ChevronRight size={16} color="rgba(0,0,0,0.3)" />
    </Pressable>
  );
}

export function ChevronRight({ size = 16, color = 'rgba(0,0,0,0.3)' }: { size?: number; color?: string }) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size} fill="none">
      <Path
        d="M6 4l4 4-4 4"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronDown({ size = 16, color = 'rgba(0,0,0,0.3)' }: { size?: number; color?: string }) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size} fill="none">
      <Path
        d="M4 6l4 4 4-4"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type FormSectionCardProps = {
  id?: string;
  sectionKey: string;
  setRef: (node: View | null) => void;
  title?: string;
  backgroundColor?: string;
  children: ReactNode;
};

export function FormSectionCard({
  sectionKey: _sectionKey,
  setRef,
  title,
  backgroundColor = '#ffffff',
  children,
}: FormSectionCardProps) {
  return (
    <View
      ref={setRef}
      style={[styles.sectionCard, { backgroundColor }]}
    >
      {title && <FormSectionTitle>{title}</FormSectionTitle>}
      {children}
    </View>
  );
}

export function FormSectionTitle({
  children,
  style,
}: {
  children: ReactNode;
  style?: object;
}) {
  return (
    <Text style={[styles.sectionTitle, style]}>
      {children}
    </Text>
  );
}

type ModuleSectionTitleProps = {
  emoji: string;
  title: string;
};

export function ModuleSectionTitle({ emoji, title }: ModuleSectionTitleProps) {
  return (
    <View style={styles.moduleTitleContainer}>
      <Text style={styles.moduleTitleEmoji}>{emoji}</Text>
      <Text style={styles.moduleTitleText}>{title}</Text>
    </View>
  );
}

type PillInputRowProps = {
  value: string;
  placeholder: string;
  onChange?: (value: string) => void;
  onPress?: () => void;
  onAddPress?: () => void;
  readOnly?: boolean;
};

export function PillInputRow({
  value,
  placeholder,
  onChange,
  onPress,
  onAddPress,
  readOnly = false,
}: PillInputRowProps) {
  return (
    <View style={styles.pillInputRow}>
      {readOnly ? (
        <Pressable style={styles.pillInputReadonly} onPress={onPress}>
          <Text
            style={[styles.pillInputText, !value ? styles.pillInputPlaceholder : undefined]}
            numberOfLines={1}
          >
            {value || placeholder}
          </Text>
        </Pressable>
      ) : (
        <TextInput
          value={value}
          placeholder={placeholder}
          placeholderTextColor="rgba(0,0,0,0.3)"
          onChangeText={onChange}
          style={styles.pillInput}
        />
      )}
      <Pressable
        style={styles.pillAddButton}
        onPress={onAddPress ?? onPress}
      >
        <Text style={styles.pillAddButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

type ModulePlainInputProps = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

export function ModulePlainInput({ value, placeholder, onChange }: ModulePlainInputProps) {
  return (
    <TextInput
      value={value}
      placeholder={placeholder}
      placeholderTextColor="rgba(0,0,0,0.35)"
      onChangeText={onChange}
      style={styles.modulePlainInput}
    />
  );
}

type FormAnchorSectionProps = {
  id?: string;
  sectionKey: string;
  setRef: (node: View | null) => void;
  children: ReactNode;
};

export function FormAnchorSection({
  sectionKey: _sectionKey,
  setRef,
  children,
}: FormAnchorSectionProps) {
  return (
    <View ref={setRef} style={styles.anchorSection}>
      {children}
    </View>
  );
}

type BasicFieldCardProps = {
  label: string;
  children: ReactNode;
};

export function BasicFieldCard({ label, children }: BasicFieldCardProps) {
  return (
    <View style={styles.basicFieldCard}>
      <Text style={styles.basicFieldCardLabel}>{label}</Text>
      <View style={styles.basicFieldCardContent}>{children}</View>
    </View>
  );
}

type BasicTextInputProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  multiline?: boolean;
};

export function BasicTextInput({ value, placeholder, onChange, multiline }: BasicTextInputProps) {
  return (
    <TextInput
      value={value}
      placeholder={placeholder}
      placeholderTextColor="rgba(0,0,0,0.3)"
      onChangeText={onChange}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      style={[
        styles.basicTextInput,
        multiline ? styles.basicTextInputMultiline : undefined,
      ]}
    />
  );
}

type BasicSelectRowProps = {
  value: string;
  placeholder: string;
  arrow?: 'right' | 'down';
  onPress?: () => void;
};

export function BasicSelectRow({
  value,
  placeholder,
  arrow = 'right',
  onPress,
}: BasicSelectRowProps) {
  const Arrow = arrow === 'down' ? ChevronDown : ChevronRight;

  return (
    <Pressable style={styles.basicSelectRow} onPress={onPress}>
      <Text
        style={[
          styles.basicSelectRowText,
          !value ? styles.basicSelectRowPlaceholder : undefined,
        ]}
        numberOfLines={1}
      >
        {value || placeholder}
      </Text>
      <Arrow size={16} color="rgba(0,0,0,0.25)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fieldRow: {
    width: '100%',
    flexDirection: 'column',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingVertical: 12,
  },
  fieldRowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.8)',
  },
  textInput: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000000',
  },
  textInputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  selectValue: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectValueText: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  selectValuePlaceholder: {
    color: 'rgba(0,0,0,0.3)',
  },
  sectionCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    color: '#000000',
    marginBottom: 12,
  },
  moduleTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  moduleTitleEmoji: {
    fontSize: 17,
    lineHeight: 20,
  },
  moduleTitleText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    color: '#000000',
  },
  pillInputRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    paddingLeft: 16,
    paddingRight: 10,
  },
  pillInputReadonly: {
    flex: 1,
    minWidth: 0,
  },
  pillInputText: {
    fontSize: 14,
    color: '#000000',
  },
  pillInputPlaceholder: {
    color: 'rgba(0,0,0,0.3)',
  },
  pillInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: '#000000',
  },
  pillAddButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillAddButtonText: {
    fontSize: 18,
    lineHeight: 20,
    color: 'rgba(0,0,0,0.25)',
  },
  modulePlainInput: {
    width: '100%',
    fontSize: 14,
    color: '#000000',
    marginBottom: 12,
  },
  anchorSection: {
    flexDirection: 'column',
    gap: 12,
  },
  basicFieldCard: {
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  basicFieldCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 12,
    color: 'rgba(0,0,0,0.4)',
  },
  basicFieldCardContent: {
    marginTop: 8,
  },
  basicTextInput: {
    width: '100%',
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
  },
  basicTextInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  basicSelectRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  basicSelectRowText: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    color: '#000000',
  },
  basicSelectRowPlaceholder: {
    color: 'rgba(0,0,0,0.3)',
  },
});
