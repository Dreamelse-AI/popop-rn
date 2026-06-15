import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

const MAX_OPENING_LINES = 10;

type OpeningPrologueFieldProps = {
  value: string[];
  onChange: (lines: string[]) => void;
};

function normalizeLines(lines: string[]): string[] {
  return lines.length > 0 ? lines : [''];
}

function CloseIcon() {
  return (
    <Svg viewBox="0 0 12 12" width={12} height={12} fill="none">
      <Path
        d="M2 2l8 8M10 2L2 10"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

type OpeningBubbleProps = {
  value: string;
  placeholder: string;
  isLast: boolean;
  canRemove: boolean;
  canAdd: boolean;
  onChange: (value: string) => void;
  onAdd: () => void;
  onRemove: () => void;
};

function OpeningBubble({
  value,
  placeholder,
  isLast,
  canRemove,
  canAdd,
  onChange,
  onAdd,
  onRemove,
}: OpeningBubbleProps) {
  return (
    <View style={styles.bubbleWrapper}>
      <View style={styles.bubble}>
        <TextInput
          value={value}
          placeholder={placeholder}
          placeholderTextColor="rgba(0,0,0,0.3)"
          onChangeText={onChange}
          style={styles.bubbleInput}
        />
        {isLast ? (
          <Pressable
            disabled={!canAdd}
            onPress={onAdd}
            style={[styles.bubbleButton, !canAdd ? styles.bubbleButtonDisabled : undefined]}
            accessibilityLabel="Add opening line"
          >
            <Text style={styles.bubbleButtonText}>+</Text>
          </Pressable>
        ) : (
          <Pressable
            disabled={!canRemove}
            onPress={onRemove}
            style={[styles.bubbleButton, !canRemove ? styles.bubbleButtonDisabled : undefined]}
            accessibilityLabel="Remove opening line"
          >
            <CloseIcon />
          </Pressable>
        )}
      </View>
      <View style={styles.bubbleTail} />
    </View>
  );
}

export function OpeningPrologueField({ value, onChange }: OpeningPrologueFieldProps) {
  const { t } = useTranslation();
  const lines = normalizeLines(value);
  const canAdd = lines.length < MAX_OPENING_LINES;

  const updateLine = (index: number, nextValue: string) => {
    const next = [...lines];
    next[index] = nextValue;
    onChange(next);
  };

  const addLine = () => {
    if (!canAdd) return;
    onChange([...lines, '']);
  };

  const removeLine = (index: number) => {
    const next = lines.filter((_, i) => i !== index);
    onChange(normalizeLines(next));
  };

  return (
    <View style={styles.container}>
      {lines.map((line, index) => (
        <OpeningBubble
          key={index}
          value={line}
          placeholder={t('character.createPage.openingLinePlaceholder')}
          isLast={index === lines.length - 1}
          canRemove={lines.length > 1}
          canAdd={canAdd}
          onChange={(nextValue) => updateLine(index, nextValue)}
          onAdd={addLine}
          onRemove={() => removeLine(index)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 10,
  },
  bubbleWrapper: {
    paddingLeft: 4,
  },
  bubble: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    paddingLeft: 16,
    paddingRight: 10,
  },
  bubbleInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: '#000000',
  },
  bubbleButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleButtonDisabled: {
    opacity: 0.3,
  },
  bubbleButtonText: {
    fontSize: 18,
    lineHeight: 20,
    color: 'rgba(0,0,0,0.25)',
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -4,
    left: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ffffff',
  },
});
